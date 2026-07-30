import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { HospitalDetails } from './hospital-details';
import { HospitalService } from '@core/services/hospital.service';
import { DoctorService } from '@core/services/doctor.service';

describe('HospitalDetails', () => {
  let harness: RouterTestingHarness;
  let router: Router;
  let hospitals: HospitalService;
  let doctors: DoctorService;

  const open = (id: string) => harness.navigateByUrl(`/hospitals/${id}`, HospitalDetails);

  const text = () => (harness.routeNativeElement?.textContent ?? '').replace(/\s+/g, ' ');
  const query = (selector: string) =>
    harness.routeNativeElement?.querySelector(selector) as HTMLElement | null;
  const queryAll = (selector: string) =>
    Array.from(harness.routeNativeElement?.querySelectorAll(selector) ?? []) as HTMLElement[];

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [
            { path: 'hospitals', loadChildren: () => import('../hospitals.routes') },
            // Registered so a doctor card can actually be followed.
            { path: 'doctors', loadChildren: () => import('@features/doctors/doctors.routes') },
          ],
          withComponentInputBinding(),
        ),
      ],
    });

    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
    hospitals = TestBed.inject(HospitalService);
    doctors = TestBed.inject(DoctorService);
  });

  // Services are root-provided, so a spy would otherwise leak into later tests.
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('route loading', () => {
    it('lands /hospitals/:hospitalId on the profile', async () => {
      const page = await open('1');

      expect(page).toBeInstanceOf(HospitalDetails);
      expect(router.url).toBe('/hospitals/1');
    });

    it('titles the tab with the hospital', async () => {
      await open('1');

      expect(TestBed.inject(Title).getTitle()).toBe('Sanjeevani Heart Centre — Deoria');
    });

    it('titles the tab honestly when the hospital does not exist', async () => {
      await open('9999');

      expect(TestBed.inject(Title).getTitle()).toBe('Hospital not found');
    });
  });

  describe('hospital lookup', () => {
    it('resolves the hospital from the existing service', async () => {
      const page = await open('1');

      expect(page.hospital()).toBe(hospitals.getById(1));
      expect(page.isNotFound()).toBe(false);
    });

    it('resolves every hospital the search can return', async () => {
      for (const listed of hospitals.getHospitals()) {
        const page = await open(String(listed.id));

        expect(page.isNotFound()).toBe(false);
      }
    });

    it('shows the identity, rating, city and doctor count', async () => {
      await open('1');

      expect(query('h1')?.textContent?.trim()).toBe('Sanjeevani Heart Centre');
      expect(query('[data-testid="city"]')?.textContent?.trim()).toBe('Deoria');
      expect(query('app-avatar')).toBeTruthy();
      expect(query('app-rating-stars')).toBeTruthy();
      expect(text()).toContain('4.7');
      // Only Dr. Asha Verma lists Sanjeevani as a practice, so the singular applies.
      expect(query('[data-testid="doctor-count"]')?.textContent?.trim()).toBe('1 doctor');
    });

    it('pluralises the doctor count', async () => {
      await open('2');

      expect(query('[data-testid="doctor-count"]')?.textContent?.trim()).toBe('2 doctors');
    });

    it('shows the about text, full address and contact number', async () => {
      const page = await open('1');
      const hospital = page.hospital()!;

      expect(query('[data-testid="about"]')?.textContent?.trim()).toBe(hospital.description);
      expect(query('[data-testid="address"]')?.textContent).toContain(hospital.address.line);
      expect(query('[data-testid="contact"]')?.textContent?.trim()).toBe(hospital.contactNumber);
      expect(query('[data-testid="contact"]')?.getAttribute('href')).toBe(
        `tel:${hospital.contactNumber}`,
      );
    });

    it('lists departments and facilities as tags', async () => {
      await open('1');

      expect(query('[aria-label="Departments"]')).toBeTruthy();
      expect(query('[aria-label="Facilities"]')).toBeTruthy();
      expect(text()).toContain('Cardiologist');
      expect(text()).toContain('Cath Lab');
    });

    it('formats opening hours through the shared util', async () => {
      await open('1');

      expect(query('[data-testid="opening-hours"]')?.textContent).toContain(
        'Mon – Sun · 08:00 AM – 09:00 PM',
      );
    });

    it('says so plainly for a round-the-clock hospital', async () => {
      const page = await open('3');
      expect(page.hospital()?.isOpen24Hours).toBe(true);

      expect(query('[data-testid="opening-hours"]')?.textContent?.trim()).toBe(
        'Open 24 hours, every day',
      );
      expect(text()).toContain('Open 24 hours');
    });

    it('names the hospital in the breadcrumb trail', async () => {
      const page = await open('1');

      expect(page.breadcrumbs().map((crumb) => crumb.label)).toEqual([
        'Home',
        'Find Hospitals',
        'Sanjeevani Heart Centre',
      ]);
    });
  });

  describe('hospital not found', () => {
    it('renders not-found for an unknown id', async () => {
      const page = await open('9999');

      expect(page.hospital()).toBeUndefined();
      expect(page.isNotFound()).toBe(true);
      expect(query('[data-testid="not-found"]')).toBeTruthy();
      expect(text()).toContain('Hospital not found');
    });

    it('renders not-found for ids that are not positive integers', async () => {
      for (const id of ['abc', '-1', '0', '1.5', '1e3']) {
        const page = await open(id);

        expect(page.isNotFound()).toBe(true);
      }
    });

    it('keeps the URL and echoes what was asked for', async () => {
      await open('abc');

      expect(router.url).toBe('/hospitals/abc');
      expect(query('[data-testid="requested-id"]')?.textContent?.trim()).toBe('abc');
    });

    it('offers a route back to the search', async () => {
      await open('9999');

      expect(query('a.btn')?.getAttribute('href')).toBe('/hospitals');
    });

    it('renders no profile content at all', async () => {
      await open('abc');

      expect(query('h1')).toBeNull();
      expect(query('[data-testid="doctor-list"]')).toBeNull();
      expect(query('app-rating-stars')).toBeNull();
    });
  });

  describe('doctors at this hospital', () => {
    it('lists them through DoctorCard, not a copy', async () => {
      // Deoria City Clinic (2) has two doctors, one of whom practises there second.
      const page = await open('2');

      expect(queryAll('app-doctor-card').length).toBe(doctors.getByHospital(2).length);
      expect(page.doctors().map((doctor) => doctor.name)).toEqual([
        'Dr. Asha Verma',
        'Dr. Rakesh Mishra',
      ]);
    });

    it('matches the count shown in the header', async () => {
      const page = await open('12');

      expect(queryAll('app-doctor-card').length).toBe(page.hospital()!.doctorCount);
    });

    it('links each doctor to their profile', async () => {
      const page = await open('2');
      const hrefs = queryAll('app-doctor-card a.card-name-link').map((link) =>
        link.getAttribute('href'),
      );

      expect(hrefs).toEqual(page.doctors().map((doctor) => `/doctors/${doctor.id}`));
    });

    it('navigates to Doctor Details when a doctor is followed', async () => {
      await open('1');

      queryAll('app-doctor-card a.card-name-link')[0].click();
      await harness.fixture.whenStable();

      expect(router.url).toBe('/doctors/1');
    });

    it('omits the practice, since it is the page you are on', async () => {
      await open('1');

      expect(query('app-doctor-card .card-practice')).toBeNull();
    });

    it('exposes no booking action — Doctor Details owns that', async () => {
      await open('1');

      expect(text()).not.toContain('Book Appointment');
      expect(queryAll('app-doctor-card button').length).toBe(0);
    });

    /**
     * Every mock hospital currently has at least one doctor, so the empty state is
     * unreachable from the data and has to be driven through the service.
     */
    it('says so when nobody practises there, reusing the shared empty state', async () => {
      vi.spyOn(doctors, 'getByHospital').mockReturnValue([]);

      const page = await open('1');

      expect(page.doctors()).toEqual([]);
      expect(query('[data-testid="doctors-empty"]')).toBeTruthy();
      expect(query('app-empty-state')).toBeTruthy();
      expect(text()).toContain('No doctors listed yet');
      expect(query('[data-testid="doctor-list"]')).toBeNull();
      expect(queryAll('app-doctor-card').length).toBe(0);
    });

    it('offers a way to keep looking from the empty state', async () => {
      vi.spyOn(doctors, 'getByHospital').mockReturnValue([]);
      await open('1');

      expect(query('[data-testid="doctors-empty"] a')?.getAttribute('href')).toBe('/doctors');
    });

    it('keeps the rest of the profile when there are no doctors', async () => {
      vi.spyOn(doctors, 'getByHospital').mockReturnValue([]);
      await open('1');

      expect(query('h1')).toBeTruthy();
      expect(query('[data-testid="contact"]')).toBeTruthy();
    });
  });

  describe('reuse', () => {
    it('frames every section with the shared profile section', async () => {
      await open('1');
      const titles = queryAll('.section-title').map((node) => node.textContent?.trim());

      expect(titles).toEqual([
        'About',
        'Departments',
        'Facilities',
        'Doctors at this hospital',
        'Contact',
        'Opening hours',
      ]);
    });
  });
});
