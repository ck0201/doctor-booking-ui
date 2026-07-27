import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Doctors } from './doctors';

describe('Doctors', () => {
  let component: Doctors;
  let fixture: ComponentFixture<Doctors>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Doctors],
    }).compileComponents();

    fixture = TestBed.createComponent(Doctors);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('fixes the state to Uttar Pradesh', () => {
    expect(component.state.name).toBe('Uttar Pradesh');
  });

  it('has no cities until a district is chosen', () => {
    expect(component.cities()).toEqual([]);
  });

  it('lists only the cities of the selected district', () => {
    component.selectedDistrict.set(component.districts[1]);

    expect(component.cities().map((city) => city.name)).toEqual([
      'Gorakhpur',
      'Bansgaon',
      'Campierganj',
      'Sahjanwa',
    ]);
  });

  it('clears the selected city when the district changes', () => {
    component.selectedDistrict.set(component.districts[0]);
    component.selectedCity.set(component.cities()[1]);
    expect(component.selectedCity()?.name).toBe('Salempur');

    component.selectedDistrict.set(component.districts[1]);

    expect(component.selectedCity()).toBeNull();
  });

  it('shows no results until the first search', () => {
    component.selectedDistrict.set(component.districts[0]);

    expect(component.results()).toEqual([]);
  });

  it('derives results from the submitted search, not the live filters', () => {
    component.selectedDistrict.set(component.districts[1]); // Gorakhpur
    component.search();
    const searched = component.results();

    expect(searched.length).toBeGreaterThan(0);
    expect(searched.every((doctor) => doctor.practice?.city.districtId === 2)).toBe(true);

    // Changing a filter without pressing Search must not move the results.
    component.selectedDistrict.set(component.districts[0]);
    expect(component.results()).toEqual(searched);
  });

  it('captures the applied filters on search', () => {
    component.doctorName.set('  Asha  ');
    component.selectedDistrict.set(component.districts[0]);
    component.selectedCity.set(component.cities()[0]);

    component.search();

    expect(component.lastSearch()).toEqual({
      doctorName: 'Asha',
      specialty: null,
      state: component.state,
      district: component.districts[0],
      city: component.cities()[0],
    });
  });
});
