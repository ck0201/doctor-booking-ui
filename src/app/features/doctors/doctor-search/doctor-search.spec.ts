import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { DoctorSearch } from './doctor-search';
import { DoctorService } from '@core/services/doctor.service';

/** Somewhere to navigate away to, so the page can be rebuilt from scratch. */
@Component({ template: '' })
class ElsewhereComponent {}

describe('DoctorSearch', () => {
  let harness: RouterTestingHarness;
  let router: Router;

  /** Navigates to a URL. The component is reused when only the query string differs. */
  const load = (url: string) => harness.navigateByUrl(url, DoctorSearch);

  /** Destroys the page and builds it again against `url` — what a browser refresh does. */
  const reload = async (url: string) => {
    await harness.navigateByUrl('/elsewhere');
    return load(url);
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [
            // The real feature routes, so relative navigation is exercised in
            // the shape production actually uses.
            { path: 'doctors', loadChildren: () => import('../doctors.routes') },
            { path: 'elsewhere', component: ElsewhereComponent },
          ],
          withComponentInputBinding(),
        ),
        // So Location.back() drives real router navigation in tests.
        provideLocationMocks(),
      ],
    });

    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
  });

  it('should create', async () => {
    expect(await load('/doctors')).toBeTruthy();
  });

  it('fixes the state to Uttar Pradesh', async () => {
    expect((await load('/doctors')).state.name).toBe('Uttar Pradesh');
  });

  describe('initial load from URL parameters', () => {
    it('seeds every filter from the query string', async () => {
      const page = await load('/doctors?name=asha&specialty=1&district=1&city=101');

      expect(page.doctorName()).toBe('asha');
      expect(page.selectedSpecialty()?.name).toBe('Cardiologist');
      expect(page.selectedDistrict()?.name).toBe('Deoria');
      expect(page.selectedCity()?.name).toBe('Deoria');
    });

    it('applies those filters to the results without pressing Search', async () => {
      const page = await load('/doctors?specialty=1&district=1');

      expect(page.results().map((doctor) => doctor.name)).toEqual(['Dr. Asha Verma']);
    });

    it('offers the cities of the district named in the URL', async () => {
      const page = await load('/doctors?district=2');

      expect(page.cities().map((city) => city.name)).toEqual([
        'Gorakhpur',
        'Bansgaon',
        'Campierganj',
        'Sahjanwa',
      ]);
    });

    it('ignores ids that do not exist', async () => {
      const page = await load('/doctors?specialty=999&district=999');

      expect(page.selectedSpecialty()).toBeNull();
      expect(page.selectedDistrict()).toBeNull();
    });

    it('ignores parameters that are not numeric ids', async () => {
      const page = await load('/doctors?specialty=abc&district=-1');

      expect(page.selectedSpecialty()).toBeNull();
      expect(page.selectedDistrict()).toBeNull();
    });

    it('ignores a city that does not belong to the district', async () => {
      const page = await load('/doctors?district=1&city=201');

      expect(page.selectedDistrict()?.name).toBe('Deoria');
      expect(page.selectedCity()).toBeNull();
    });
  });

  describe('search updates the URL', () => {
    it('writes every applied filter into the query string', async () => {
      const page = await load('/doctors');

      page.doctorName.set('  Asha  ');
      page.selectedSpecialty.set(page.specialties[0]);
      page.selectedDistrict.set(page.districts[0]);
      page.selectedCity.set(page.cities()[1]);

      await page.search();

      expect(router.url).toContain('name=Asha');
      expect(router.url).toContain('specialty=1');
      expect(router.url).toContain('district=1');
      expect(router.url).toContain('city=102');
    });

    it('omits filters that were left empty', async () => {
      const page = await load('/doctors');
      page.selectedDistrict.set(page.districts[1]);

      await page.search();

      expect(router.url).toContain('district=2');
      expect(router.url).not.toContain('name=');
      expect(router.url).not.toContain('specialty=');
      expect(router.url).not.toContain('city=');
    });

    it('drops a filter that was cleared since the last search', async () => {
      const page = await load('/doctors?name=asha&specialty=1');

      page.selectedSpecialty.set(null);
      await page.search();

      expect(router.url).toContain('name=asha');
      expect(router.url).not.toContain('specialty=');
    });

    it('marks a search that has no filters at all', async () => {
      const page = await load('/doctors');

      await page.search();

      expect(router.url).toContain('searched=1');
      expect(page.appliedCriteria()).not.toBeNull();
      // An unfiltered search shows everyone, rather than falling back to the prompt.
      expect(page.results().length).toBe(TestBed.inject(DoctorService).getDoctors().length);
    });
  });

  describe('browser refresh restores filters', () => {
    it('reloading the searched URL rebuilds the same panel and results', async () => {
      const page = await load('/doctors');
      page.doctorName.set('dr');
      page.selectedSpecialty.set(page.specialties[7]); // General Physician
      page.selectedDistrict.set(page.districts[1]); // Gorakhpur
      page.selectedCity.set(page.cities()[0]); // Gorakhpur city
      await page.search();

      const searchedUrl = router.url;
      const submitted = page.appliedCriteria();
      const submittedResults = page.results();

      const reloaded = await reload(searchedUrl);

      expect(reloaded).not.toBe(page);
      expect(reloaded.doctorName()).toBe('dr');
      expect(reloaded.selectedSpecialty()?.name).toBe('General Physician');
      expect(reloaded.selectedDistrict()?.name).toBe('Gorakhpur');
      expect(reloaded.selectedCity()?.name).toBe('Gorakhpur');
      expect(reloaded.appliedCriteria()).toEqual(submitted);
      expect(reloaded.results()).toEqual(submittedResults);
    });

    it('restores a no-filter search rather than the prompt', async () => {
      const page = await load('/doctors');
      await page.search();

      const reloaded = await reload(router.url);

      expect(reloaded).not.toBe(page);
      expect(reloaded.appliedCriteria()).not.toBeNull();
      expect(reloaded.hasFilters()).toBe(false);
    });
  });

  describe('empty params preserve the default state', () => {
    it('opens a bare /doctors on the prompt', async () => {
      const page = await load('/doctors');

      expect(page.doctorName()).toBe('');
      expect(page.selectedSpecialty()).toBeNull();
      expect(page.selectedDistrict()).toBeNull();
      expect(page.selectedCity()).toBeNull();
      expect(page.cities()).toEqual([]);
      expect(page.hasFilters()).toBe(false);
      expect(page.appliedCriteria()).toBeNull();
      expect(page.results()).toEqual([]);
    });

    it('treats blank parameter values as absent', async () => {
      const page = await load('/doctors?name=&specialty=&district=&city=');

      expect(page.appliedCriteria()).toBeNull();
      expect(page.results()).toEqual([]);
    });
  });

  describe('behaviour carried over from before the URL change', () => {
    it('has no cities until a district is chosen', async () => {
      expect((await load('/doctors')).cities()).toEqual([]);
    });

    it('clears the selected city when the district changes', async () => {
      const page = await load('/doctors?district=1&city=102');
      expect(page.selectedCity()?.name).toBe('Salempur');

      page.selectedDistrict.set(page.districts[1]);

      expect(page.selectedCity()).toBeNull();
    });

    it('does not move the results until Search is pressed', async () => {
      const page = await load('/doctors?district=2');
      const before = page.results();
      expect(before.length).toBeGreaterThan(0);

      page.selectedDistrict.set(page.districts[0]);

      expect(page.results()).toEqual(before);
    });

    it('re-syncs the panel when the URL changes underneath it', async () => {
      const page = await load('/doctors?district=1&city=101');

      // Same route, new query string — what the back button produces.
      const same = await load('/doctors?district=2&city=204');

      expect(same).toBe(page);
      expect(page.selectedDistrict()?.name).toBe('Gorakhpur');
      expect(page.selectedCity()?.name).toBe('Sahjanwa');
    });
  });

  /**
   * Result cards link to profiles now, so the round trip has to work: out to a
   * profile and back to the search the user had, filters intact (ADR-021).
   */
  describe('navigating from results to a doctor profile', () => {
    const SEARCH_URL = '/doctors?specialty=1&district=1';

    const cardLinks = () =>
      Array.from(
        harness.routeNativeElement?.querySelectorAll('.doctor-grid a.card-name-link') ?? [],
      ) as HTMLAnchorElement[];

    it('gives every result card a link to that doctor', async () => {
      const page = await load(SEARCH_URL);
      const links = cardLinks();

      expect(links.length).toBe(page.results().length);
      expect(links.map((link) => link.getAttribute('href'))).toEqual(
        page.results().map((doctor) => `/doctors/${doctor.id}`),
      );
    });

    it('navigates to the profile when a card is activated', async () => {
      const page = await load(SEARCH_URL);
      const expectedId = page.results()[0].id;

      cardLinks()[0].click();
      await harness.fixture.whenStable();

      expect(router.url).toBe(`/doctors/${expectedId}`);
    });

    it('lands on the profile of the doctor that was clicked', async () => {
      await load(SEARCH_URL);
      cardLinks()[0].click();
      await harness.fixture.whenStable();

      expect(harness.routeNativeElement?.textContent).toContain('Dr. Asha Verma');
    });

    /**
     * Going back is asserted in two halves, because RouterTestingHarness does
     * not wire popstate through to the Router: first that the history entry the
     * back button returns to still carries the whole search, then that loading
     * that entry rebuilds the page. Joining the two is Angular's job, not ours.
     */
    it('leaves the full search in the history entry behind the profile', async () => {
      await load(SEARCH_URL);
      cardLinks()[0].click();
      await harness.fixture.whenStable();
      expect(router.url).not.toBe(SEARCH_URL);

      TestBed.inject(Location).back();

      expect(TestBed.inject(Location).path()).toBe(SEARCH_URL);
    });

    it('restores the panel and the results from that entry', async () => {
      await load(SEARCH_URL);
      cardLinks()[0].click();
      await harness.fixture.whenStable();

      const location = TestBed.inject(Location);
      location.back();
      const restored = await load(location.path());

      expect(router.url).toBe(SEARCH_URL);
      expect(restored.selectedSpecialty()?.name).toBe('Cardiologist');
      expect(restored.selectedDistrict()?.name).toBe('Deoria');
      expect(restored.appliedCriteria()).not.toBeNull();
      expect(restored.results().map((doctor) => doctor.name)).toEqual(['Dr. Asha Verma']);
    });

    it('survives a second round trip', async () => {
      await load('/doctors?district=2');
      const firstCount = cardLinks().length;
      expect(firstCount).toBeGreaterThan(1);

      cardLinks()[0].click();
      await harness.fixture.whenStable();

      const location = TestBed.inject(Location);
      location.back();
      await load(location.path());

      expect(router.url).toBe('/doctors?district=2');
      expect(cardLinks().length).toBe(firstCount);
    });
  });
});
