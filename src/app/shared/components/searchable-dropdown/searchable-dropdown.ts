import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  afterRenderEffect,
  computed,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { LookupItem } from '../../../core/models/lookup-item.model';

let nextDropdownId = 0;

/**
 * Reusable searchable dropdown (combobox) for lookup data (ADR-003).
 *
 * Generic over any object extending LookupItem, so it can drive Specialty,
 * District, City, Hospital and every future lookup without modification.
 *
 * Two-way bound through `value` (a model signal). That is deliberately the
 * shape a ControlValueAccessor wraps, so Reactive Forms support later means
 * adding the NG_VALUE_ACCESSOR provider and delegating:
 *   writeValue        -> this.value.set(...)
 *   registerOnChange  -> this.value subscription / output
 *   registerOnTouched -> this.touched output
 *   setDisabledState  -> this.formDisabled.set(...)
 * No restructuring of this component is required.
 */
@Component({
  selector: 'app-searchable-dropdown',
  templateUrl: './searchable-dropdown.html',
  styleUrl: './searchable-dropdown.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'searchable-dropdown' },
})
export class SearchableDropdown<T extends LookupItem = LookupItem> {
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly listRef = viewChild<ElementRef<HTMLElement>>('list');

  /** Unique id so label/input/listbox associations stay valid with many instances. */
  protected readonly controlId = `searchable-dropdown-${nextDropdownId++}`;

  readonly label = input('');
  readonly placeholder = input('Search...');
  readonly items = input<readonly T[]>([]);
  readonly disabled = input(false);
  readonly clearable = input(true);
  readonly emptyMessage = input('No results found');

  /** How an item is rendered and searched. Override for non-`name` labels. */
  readonly displayWith = input<(item: T) => string>((item) => item.name);

  /** Currently selected item. Supports `[(value)]`. */
  readonly value = model<T | null>(null);

  /** Emitted when the control loses focus — the future CVA `onTouched` hook. */
  readonly touched = output<void>();

  /** Set by a future `setDisabledState` call from Reactive Forms. */
  private readonly formDisabled = signal(false);

  protected readonly isOpen = signal(false);
  protected readonly query = signal('');
  protected readonly activeIndex = signal(-1);

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  protected readonly selectedLabel = computed(() => {
    const selected = this.value();
    return selected ? this.displayWith()(selected) : '';
  });

  /**
   * While the panel is open the input shows what the user is typing;
   * when closed it shows the current selection.
   */
  protected readonly displayText = computed(() =>
    this.isOpen() ? this.query() : this.selectedLabel(),
  );

  protected readonly filteredItems = computed(() => {
    const query = this.query().trim().toLowerCase();
    if (!query) {
      return this.items();
    }

    const displayWith = this.displayWith();
    return this.items().filter((item) => displayWith(item).toLowerCase().includes(query));
  });

  constructor() {
    // Keep the keyboard-highlighted option visible while arrowing through a
    // scrollable list. Runs after the DOM has been updated.
    afterRenderEffect(() => {
      if (!this.isOpen() || this.activeIndex() < 0) {
        return;
      }

      const active =
        this.listRef()?.nativeElement.querySelector<HTMLElement>('.dropdown-item--active');
      active?.scrollIntoView?.({ block: 'nearest' });
    });
  }

  protected open(): void {
    if (this.isDisabled() || this.isOpen()) {
      return;
    }

    this.query.set('');
    this.isOpen.set(true);
    this.activeIndex.set(this.initialActiveIndex());
  }

  protected close(): void {
    if (!this.isOpen()) {
      return;
    }

    this.isOpen.set(false);
    this.query.set('');
    this.activeIndex.set(-1);
  }

  protected toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  protected onSearch(text: string): void {
    this.query.set(text);
    this.isOpen.set(true);
    // Pre-highlight the best match so Enter selects it straight away.
    this.activeIndex.set(this.filteredItems().length ? 0 : -1);
  }

  protected select(item: T): void {
    this.value.set(item);
    this.close();
  }

  protected clear(event: Event): void {
    event.stopPropagation();
    this.value.set(null);
    this.close();
    this.focusInput();
  }

  protected isSelected(item: T): boolean {
    return this.value()?.id === item.id;
  }

  protected optionId(index: number): string {
    return `${this.controlId}-option-${index}`;
  }

  protected onBlur(): void {
    this.touched.emit();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (this.isOpen()) {
          this.moveActive(1);
        } else {
          this.open();
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (this.isOpen()) {
          this.moveActive(-1);
        } else {
          this.open();
        }
        break;

      case 'Home':
        if (this.isOpen()) {
          event.preventDefault();
          this.activeIndex.set(this.filteredItems().length ? 0 : -1);
        }
        break;

      case 'End':
        if (this.isOpen()) {
          event.preventDefault();
          this.activeIndex.set(this.filteredItems().length - 1);
        }
        break;

      case 'Enter': {
        if (!this.isOpen()) {
          break;
        }
        event.preventDefault();
        const active = this.filteredItems()[this.activeIndex()];
        if (active) {
          this.select(active);
        }
        break;
      }

      case 'Escape':
        if (this.isOpen()) {
          event.preventDefault();
          this.close();
        }
        break;

      case 'Tab':
        this.close();
        break;
    }
  }

  /** Click outside closes the panel without changing the selection. */
  @HostListener('document:pointerdown', ['$event'])
  protected onDocumentPointerDown(event: PointerEvent): void {
    if (!this.isOpen()) {
      return;
    }

    if (!this.hostRef.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  private moveActive(step: number): void {
    const count = this.filteredItems().length;
    if (!count) {
      this.activeIndex.set(-1);
      return;
    }

    // Wraps around both ends; starts at either end when nothing is highlighted.
    this.activeIndex.update((current) => {
      if (current < 0) {
        return step > 0 ? 0 : count - 1;
      }
      return (current + step + count) % count;
    });
  }

  /** Highlight the current selection on open, otherwise the first option. */
  private initialActiveIndex(): number {
    const items = this.filteredItems();
    if (!items.length) {
      return -1;
    }

    const selected = this.value();
    const selectedIndex = selected ? items.findIndex((item) => item.id === selected.id) : -1;
    return selectedIndex >= 0 ? selectedIndex : 0;
  }

  private focusInput(): void {
    this.hostRef.nativeElement.querySelector('input')?.focus();
  }
}
