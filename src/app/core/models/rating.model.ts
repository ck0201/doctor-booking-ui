/**
 * A star rating summary.
 *
 * DoctorRating in doctor.model.ts has the same shape and is deliberately left
 * alone: aliasing it here would be a refactor of a module that is complete, for
 * no functional gain. Worth collapsing the day something else touches it.
 */
export interface Rating {
  /** 0 – 5, to one decimal place. */
  readonly value: number;
  readonly reviewCount: number;
}
