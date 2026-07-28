import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { Doctors } from './doctors';
import { DoctorService } from '@core/services/doctor.service';

/** Somewhere to navigate away to, so the page can be rebuilt from scratch. */
@Component({ template: '' })
class ElsewhereComponent {}

describe('Doctors', () => {
  let harness: RouterTestingHarness;
  let router: Router;

  /** Navigates to a URL. The component is reused when only the query string differs. */
  const load = (url: string) => harness.navigateByUrl(url, Doctors);

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
            { path: 'doctors', component: Doctors },
            { path: 'elsewhere', component: ElsewhereComponent },
          ],
          withComponentInputBinding(),
        ),
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
});
