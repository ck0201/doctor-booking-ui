import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { HospitalSearch } from './hospital-search';
import { HospitalService } from '@core/services/hospital.service';

describe('HospitalSearch', () => {
  let harness: RouterTestingHarness;
  let router: Router;
  let hospitals: HospitalService;

  const load = (url: string) => harness.navigateByUrl(url, HospitalSearch);

  const text = () => (harness.routeNativeElement?.textContent ?? '').replace(/\s+/g, ' ');
  const query = (selector: string) =>
    harness.routeNativeElement?.querySelector(selector) as HTMLElement | null;
  const cards = () =>
    Array.from(harness.routeNativeElement?.querySelectorAll('app-hospital-card') ?? []);
  const names = () =>
    Array.from(harness.routeNativeElement?.querySelectorAll('[data-testid="name"]') ?? []).map(
      (node) => node.textContent?.trim(),
    );
  const input = () => query('[data-testid="search-input"]') as HTMLInputElement;

  /** Types into the box exactly as a user would, then settles the navigation. */
  const type = async (value: string) => {
    const box = input();
    box.value = value;
    box.dispatchEvent(new Event('input'));
    await harness.fixture.whenStable();
    harness.detectChanges();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [{ path: 'hospitals', loadChildren: () => import('../hospitals.routes') }],
          withComponentInputBinding(),
        ),
        // So Location.back() can be used to inspect the history.
        provideLocationMocks(),
      ],
    });

    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
    hospitals = TestBed.inject(HospitalService);
  });

  describe('route loading', () => {
    it('lands /hospitals on the search page', async () => {
      const page = await load('/hospitals');

      expect(page).toBeInstanceOf(HospitalSearch);
      expect(router.url).toBe('/hospitals');
    });

    it('titles the tab', async () => {
      await load('/hospitals');

      expect(TestBed.inject(Title).getTitle()).toBe('Find Hospitals');
    });
  });

  describe('rendering', () => {
    it('shows the heading and the search box', async () => {
      await load('/hospitals');

      expect(query('h1')?.textContent?.trim()).toBe('Find Hospitals');
      expect(input()).toBeTruthy();
    });

    it('lists every hospital before anything is typed', async () => {
      const page = await load('/hospitals');

      expect(cards().length).toBe(hospitals.getHospitals().length);
      expect(page.hasQuery()).toBe(false);
      expect(query('[data-testid="hospital-grid"]')).toBeTruthy();
    });

    it('reads the hospitals from the existing service', async () => {
      const page = await load('/hospitals');

      expect(page.results()).toEqual(hospitals.searchByText(''));
    });
  });

  describe('result count', () => {
    it('counts everything with no query', async () => {
      await load('/hospitals');

      expect(query('[data-testid="result-count"]')?.textContent).toContain(
        `${hospitals.getHospitals().length} hospitals`,
      );
    });

    it('counts the matches and names the query', async () => {
      await load('/hospitals?q=drishti');
      const count = query('[data-testid="result-count"]')?.textContent ?? '';

      expect(count).toContain('1 hospital');
      expect(count).toContain('drishti');
    });

    it('uses the singular for one match', async () => {
      await load('/hospitals?q=drishti');

      expect(query('[data-testid="result-count"]')?.textContent).not.toContain('hospitals');
    });

    it('follows the results as the query changes', async () => {
      await load('/hospitals');
      await type('gorakhpur');

      expect(query('[data-testid="result-count"]')?.textContent).toContain(`${cards().length}`);
    });
  });

  describe('search filtering', () => {
    it('matches on hospital name', async () => {
      await load('/hospitals?q=sanjeevani');

      expect(names()).toEqual(['Sanjeevani Heart Centre']);
    });

    it('matches on city', async () => {
      const page = await load('/hospitals?q=salempur');

      expect(page.results().every((hospital) => hospital.address.city.name === 'Salempur')).toBe(
        true,
      );
      expect(names()).toEqual(['Matru Chhaya Nursing Home']);
    });

    it('matches on specialty', async () => {
      const page = await load('/hospitals?q=neurologist');

      expect(page.results().length).toBeGreaterThan(0);
      expect(
        page
          .results()
          .every((hospital) =>
            hospital.departments.some((department) => department.name === 'Neurologist'),
          ),
      ).toBe(true);
    });

    it('ignores case and surrounding space', async () => {
      const page = await load('/hospitals?q=%20DRISHTI%20');

      expect(page.results().length).toBe(1);
    });

    it('matches part of a word', async () => {
      const page = await load('/hospitals?q=eye');

      expect(page.results().length).toBeGreaterThan(0);
    });

    it('filters as the user types, without a submit', async () => {
      await load('/hospitals');
      const all = cards().length;

      await type('dental');

      expect(cards().length).toBeLessThan(all);
      expect(names()).toEqual(['Smile Care Dental']);
    });

    it('widens again when the query is shortened', async () => {
      await load('/hospitals?q=dental');
      expect(cards().length).toBe(1);

      await type('');

      expect(cards().length).toBe(hospitals.getHospitals().length);
    });
  });

  describe('URL synchronisation', () => {
    it('seeds the box from the URL', async () => {
      await load('/hospitals?q=drishti');

      expect(input().value).toBe('drishti');
    });

    it('writes what is typed into the URL', async () => {
      await load('/hospitals');

      await type('apollo');

      expect(router.url).toBe('/hospitals?q=apollo');
    });

    it('drops the parameter when the box is cleared', async () => {
      await load('/hospitals?q=drishti');

      await type('');

      expect(router.url).toBe('/hospitals');
    });

    it('does not keep a blank parameter for whitespace', async () => {
      await load('/hospitals');

      await type('   ');

      expect(router.url).toBe('/hospitals');
    });

    it('survives a refresh, because the query is in the URL', async () => {
      await load('/hospitals');
      await type('gorakhpur');
      const searchedUrl = router.url;
      const before = names();

      // A refresh is a fresh component reading the same URL.
      await harness.navigateByUrl('/');
      const reloaded = await load(searchedUrl);

      expect(reloaded.query()).toBe('gorakhpur');
      expect(input().value).toBe('gorakhpur');
      expect(names()).toEqual(before);
    });

    it('re-seeds the box when the URL changes underneath it', async () => {
      const page = await load('/hospitals?q=dental');

      const same = await load('/hospitals?q=neurologist');

      expect(same).toBe(page);
      expect(page.query()).toBe('neurologist');
      expect(input().value).toBe('neurologist');
    });

    it('does not fill the history with one entry per keystroke', async () => {
      await load('/hospitals');

      await type('g');
      await type('go');
      await type('gor');
      expect(router.url).toBe('/hospitals?q=gor');

      // Three keystrokes replaced one entry, so one step back leaves the page
      // entirely rather than retracing 'go' and 'g'.
      TestBed.inject(Location).back();

      expect(TestBed.inject(Location).path()).toBe('');
    });
  });

  describe('empty state', () => {
    it('says so when nothing matches, reusing the shared component', async () => {
      const page = await load('/hospitals?q=zzzz');

      expect(page.hasResults()).toBe(false);
      expect(query('[data-testid="hospitals-empty"]')).toBeTruthy();
      expect(query('app-empty-state')).toBeTruthy();
      expect(text()).toContain('No hospitals match your search');
      expect(query('[data-testid="hospital-grid"]')).toBeNull();
    });

    it('reports zero in the count', async () => {
      await load('/hospitals?q=zzzz');

      expect(query('[data-testid="result-count"]')?.textContent).toContain('0 hospitals');
    });

    it('names what was searched for', async () => {
      await load('/hospitals?q=zzzz');

      expect(text()).toContain('zzzz');
    });

    it('offers a way back to the full list', async () => {
      await load('/hospitals?q=zzzz');

      query('[data-testid="hospitals-empty"] button')!.click();
      await harness.fixture.whenStable();
      harness.detectChanges();

      expect(router.url).toBe('/hospitals');
      expect(cards().length).toBe(hospitals.getHospitals().length);
    });
  });

  describe('scope', () => {
    it('shows no booking action anywhere', async () => {
      await load('/hospitals');

      expect(text()).not.toContain('Book Appointment');
    });

    it('offers no sorting or pagination', async () => {
      await load('/hospitals');

      for (const absent of ['Sort', 'Next page', 'Previous']) {
        expect(text()).not.toContain(absent);
      }
    });
  });
});
