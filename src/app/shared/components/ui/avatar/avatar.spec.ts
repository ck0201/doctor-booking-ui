import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Avatar } from './avatar';

@Component({
  imports: [Avatar],
  template: `<app-avatar [name]="name()" [photoUrl]="photoUrl()" />`,
})
class HostComponent {
  readonly name = signal('Dr. Asha Verma');
  readonly photoUrl = signal<string | undefined>(undefined);
}

describe('Avatar', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = (selector: string) =>
    fixture.nativeElement.querySelector(selector) as HTMLElement | null;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows initials when there is no photo', () => {
    expect(query('.avatar-initials')?.textContent?.trim()).toBe('AV');
    expect(query('.avatar-image')).toBeNull();
  });

  it('shows the photo when there is one', () => {
    host.photoUrl.set('/doctors/asha.jpg');
    fixture.detectChanges();

    expect(query('.avatar-image')?.getAttribute('src')).toBe('/doctors/asha.jpg');
    expect(query('.avatar-initials')).toBeNull();
  });

  it('drops the honorific and uses first and last name', () => {
    const cases: readonly [string, string][] = [
      ['Dr. Asha Verma', 'AV'],
      ['dr Anil Gupta', 'AG'],
      ['Dr. Mohan Lal Srivastava', 'MS'],
      ['Ritu', 'R'],
      ['  Kavita   Pandey  ', 'KP'],
    ];

    for (const [name, expected] of cases) {
      host.name.set(name);
      fixture.detectChanges();

      expect(query('.avatar-initials')?.textContent?.trim()).toBe(expected);
    }
  });

  it('is hidden from assistive tech, because the name is always alongside', () => {
    expect(query('app-avatar')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('leaves the photo alt empty so the name is not announced twice', () => {
    host.photoUrl.set('/doctors/asha.jpg');
    fixture.detectChanges();

    expect(query('.avatar-image')?.getAttribute('alt')).toBe('');
  });
});
