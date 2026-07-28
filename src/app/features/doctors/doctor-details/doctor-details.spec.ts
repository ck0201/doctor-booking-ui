import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { DoctorDetails } from './doctor-details';
import { DoctorService } from '@core/services/doctor.service';

describe('DoctorDetails', () => {
  let harness: RouterTestingHarness;
  let router: Router;
  let doctors: DoctorService;

  /** Routes through the real feature route table, exactly as production does. */
  const open = (id: string) => harness.navigateByUrl(`/doctors/${id}`, DoctorDetails);

  const text = () => (harness.routeNativeElement?.textContent ?? '').replace(/\s+/g, ' ');
  const query = (selector: string) =>
    harness.routeNativeElement?.querySelector(selector) as HTMLElement | null;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [{ path: 'doctors', loadChildren: () => import('../doctors.routes') }],
          withComponentInputBinding(),
        ),
      ],
    });

    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
    doctors = TestBed.inject(DoctorService);
  });

  describe('a valid id', () => {
    it('resolves the doctor behind that id', async () => {
      const page = await open('1');

      expect(page.doctor()?.id).toBe(1);
      expect(page.isNotFound()).toBe(false);
      expect(query('[data-testid="not-found"]')).toBeNull();
    });

    it('renders the identity and headline figures', async () => {
      await open('1');

      expect(query('h1')?.textContent?.trim()).toBe('Dr. Asha Verma');
      expect(text()).toContain('Cardiologist');
      expect(text()).toContain('MBBS, MD (Cardiology)');
      expect(text()).toContain('14 yrs');
      expect(text()).toContain('4.8');
      expect(text()).toContain('₹700');
      expect(text()).toContain('Verified');
      expect(text()).toContain('Available today');
    });

    it('renders every profile section', async () => {
      const page = await open('1');
      const doctor = page.doctor()!;

      expect(text()).toContain(doctor.about.slice(0, 40));
      expect(text()).toContain(doctor.education[0].institute);
      expect(text()).toContain(doctor.experience[0].role);
      expect(text()).toContain(doctor.registrations[0].registrationNumber);
      expect(text()).toContain(doctor.services[0]);
      expect(text()).toContain(doctor.languages[0]);
      expect(text()).toContain(doctor.practices[0].addressLine);
      expect(text()).toContain(doctor.reviews[0].comment.slice(0, 40));
    });

    it('lists every practice, not only the primary one', async () => {
      const page = await open('1');
      expect(page.doctor()!.practices.length).toBe(2);

      expect(query('.practice-list')?.children.length).toBe(2);
      expect(text()).toContain('Sanjeevani Heart Centre');
      expect(text()).toContain('Deoria City Clinic');
    });

    it('marks the doctor still in a role as Present', async () => {
      const page = await open('1');

      expect(page.periodLabel(2016, undefined)).toBe('2016 – Present');
      expect(page.periodLabel(2012, 2016)).toBe('2012 – 2016');
      expect(text()).toContain('Present');
    });

    it('builds the star distribution as percentages of all ratings', async () => {
      const page = await open('1');
      const rows = page.ratingRows();

      expect(rows.map((row) => row.star)).toEqual([5, 4, 3, 2, 1]);
      expect(rows[0].count).toBe(180);
      expect(rows[0].percent).toBe(Math.round((180 / 212) * 100));
      expect(query('.rating-bars')?.children.length).toBe(5);
    });

    it('derives initials for the avatar when there is no photo', async () => {
      await open('1');

      expect(query('.avatar-initials')?.textContent?.trim()).toBe('AV');
      expect(query('.avatar-image')).toBeNull();
    });

    it('lists the specialties as tags', async () => {
      await open('1');

      expect(query('.profile-specialties')?.textContent).toContain('Cardiologist');
      expect(query('[aria-label="Specialties"]')).toBeTruthy();
    });

    it('titles each section through the shared section component', async () => {
      await open('1');
      const titles = Array.from(
        harness.routeNativeElement?.querySelectorAll('.section-title') ?? [],
      ).map((node) => node.textContent?.trim());

      expect(titles).toEqual([
        'About',
        'Education',
        'Experience',
        'Services',
        'Languages',
        'Registrations',
        'Practice Locations',
        'Patient Reviews',
      ]);
    });

    it('names the doctor in the breadcrumb trail', async () => {
      const page = await open('1');

      expect(page.breadcrumbs().map((crumb) => crumb.label)).toEqual([
        'Home',
        'Find Doctors',
        'Dr. Asha Verma',
      ]);
      expect(query('nav[aria-label="Breadcrumb"]')).toBeTruthy();
    });

    it('reserves the booking region without filling it', async () => {
      await open('1');

      expect(text()).not.toContain('Book');
      expect(query('button')).toBeNull();
    });

    it('degrades for a doctor with only the required fields', async () => {
      const page = await open('12');
      const doctor = page.doctor()!;

      expect(doctor.name).toBe('Dr. Ritu Sahani');
      expect(text()).toContain('Psychiatrist');
      expect(page.ratingRows()).toEqual([]);
      expect(query('.rating-summary')).toBeNull();
      expect(query('.side-fee')).toBeNull();
      expect(text()).toContain('No written reviews yet.');
      // Sections with no data are absent rather than empty.
      expect(text()).not.toContain('Education');
      expect(text()).not.toContain('Registrations');
    });

    it('resolves every doctor the search can return', async () => {
      for (const listed of doctors.getDoctors()) {
        const page = await open(String(listed.id));
        expect(page.isNotFound()).toBe(false);
      }
    });
  });

  describe('an invalid id', () => {
    const invalid = ['abc', '-1', '0', '1.5', '1e3', '0x2', 'null', '%20'];

    it('renders not-found for anything that is not a positive integer', async () => {
      for (const id of invalid) {
        const page = await open(id);

        expect(page.isNotFound()).toBe(true);
        expect(page.doctor()).toBeUndefined();
        expect(query('[data-testid="not-found"]')).toBeTruthy();
      }
    });

    it('does not throw or redirect away from the URL', async () => {
      await open('abc');

      expect(router.url).toBe('/doctors/abc');
    });

    it('renders no profile content at all', async () => {
      await open('abc');

      expect(query('h1')).toBeNull();
      expect(query('.profile')).toBeNull();
      expect(query('.rating-summary')).toBeNull();
    });
  });

  describe('an unknown id', () => {
    it('renders not-found for a well-formed id nobody has', async () => {
      const page = await open('9999');

      expect(page.doctor()).toBeUndefined();
      expect(page.isNotFound()).toBe(true);
      expect(text()).toContain('Doctor not found');
    });

    it('keeps the URL so the user can see what they asked for', async () => {
      await open('9999');

      expect(router.url).toBe('/doctors/9999');
      expect(query('[data-testid="requested-id"]')?.textContent?.trim()).toBe('9999');
    });

    it('offers a route back to the search', async () => {
      await open('9999');
      const back = query('a.btn');

      expect(back?.getAttribute('href')).toBe('/doctors');
    });

    it('says not-found in the breadcrumb trail', async () => {
      const page = await open('9999');

      expect(page.breadcrumbs().map((crumb) => crumb.label)).toEqual([
        'Home',
        'Find Doctors',
        'Doctor not found',
      ]);
    });
  });

  describe('navigation between profiles', () => {
    it('swaps the content when the id changes', async () => {
      const first = await open('1');
      expect(text()).toContain('Dr. Asha Verma');

      const second = await open('8');

      expect(second).toBe(first);
      expect(second.doctor()?.name).toBe('Dr. Anil Gupta');
      expect(text()).toContain('Dr. Anil Gupta');
      expect(text()).not.toContain('Dr. Asha Verma');
    });

    it('recomputes every derived value, not just the name', async () => {
      await open('1');
      const page = await open('12');

      expect(query('.avatar-initials')?.textContent?.trim()).toBe('RS');
      expect(page.ratingRows()).toEqual([]);
      expect(page.breadcrumbs()[2].label).toBe('Dr. Ritu Sahani');
    });

    it('recovers from a bad id to a good one', async () => {
      const page = await open('abc');
      expect(page.isNotFound()).toBe(true);

      await open('1');

      expect(page.isNotFound()).toBe(false);
      expect(text()).toContain('Dr. Asha Verma');
      expect(query('[data-testid="not-found"]')).toBeNull();
    });

    it('falls back to not-found when leaving a good id for a bad one', async () => {
      const page = await open('1');
      expect(page.isNotFound()).toBe(false);

      await open('9999');

      expect(page.isNotFound()).toBe(true);
      expect(query('.profile')).toBeNull();
    });

    it('returns to the search page with its filters intact', async () => {
      await open('1');

      await harness.navigateByUrl('/doctors?district=2&city=201');

      expect(router.url).toBe('/doctors?district=2&city=201');
    });
  });
});
