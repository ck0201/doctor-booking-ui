import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import doctorsRoutes from './doctors.routes';
import { DoctorSearch } from './doctor-search/doctor-search';
import { DoctorDetails } from './doctor-details/doctor-details';

/**
 * Verifies the doctors route group end to end: the lazy chunk resolves, both
 * paths land on the right page, and the id reaches DoctorDetails (ADR-019).
 */
describe('doctors.routes', () => {
  let harness: RouterTestingHarness;
  let router: Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [{ path: 'doctors', loadChildren: () => import('./doctors.routes') }],
          withComponentInputBinding(),
        ),
      ],
    });

    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
  });

  it('declares the two doctor pages', () => {
    expect(doctorsRoutes.map((route) => route.path)).toEqual(['', ':id']);
  });

  it('gives the search page a static title and the profile a resolved one', () => {
    expect(doctorsRoutes[0].title).toBe('Find Doctors');
    expect(typeof doctorsRoutes[1].title).toBe('function');
  });

  it('lands /doctors on the search page', async () => {
    const page = await harness.navigateByUrl('/doctors', DoctorSearch);

    expect(page).toBeInstanceOf(DoctorSearch);
    expect(router.url).toBe('/doctors');
  });

  it('keeps query parameters on the search page', async () => {
    const page = await harness.navigateByUrl('/doctors?district=2', DoctorSearch);

    expect(page.selectedDistrict()?.name).toBe('Gorakhpur');
  });

  it('lands /doctors/:id on the profile page', async () => {
    const page = await harness.navigateByUrl('/doctors/1', DoctorDetails);

    expect(page).toBeInstanceOf(DoctorDetails);
    expect(router.url).toBe('/doctors/1');
  });

  it('binds the route id into the profile page', async () => {
    const page = await harness.navigateByUrl('/doctors/8', DoctorDetails);

    expect(page.id()).toBe('8');
    expect(page.doctor()?.id).toBe(8);
  });

  it('titles the tab with the doctor', async () => {
    await harness.navigateByUrl('/doctors/1', DoctorDetails);

    expect(TestBed.inject(Title).getTitle()).toBe('Dr. Asha Verma — Cardiologist');
  });

  it('titles the tab honestly when the doctor does not exist', async () => {
    await harness.navigateByUrl('/doctors/9999', DoctorDetails);

    expect(TestBed.inject(Title).getTitle()).toBe('Doctor not found');
  });

  it('re-binds the id when navigating between profiles', async () => {
    const first = await harness.navigateByUrl('/doctors/1', DoctorDetails);
    const second = await harness.navigateByUrl('/doctors/2', DoctorDetails);

    expect(second).toBe(first);
    expect(second.id()).toBe('2');
  });

  it('moves between the two pages in both directions', async () => {
    await harness.navigateByUrl('/doctors?specialty=1', DoctorSearch);
    await harness.navigateByUrl('/doctors/1', DoctorDetails);
    expect(router.url).toBe('/doctors/1');

    const back = await harness.navigateByUrl('/doctors?specialty=1', DoctorSearch);
    expect(back.selectedSpecialty()?.name).toBe('Cardiologist');
  });
});
