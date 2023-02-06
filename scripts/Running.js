import WorkOut from './Workout.js';
export default class Running extends WorkOut {
  type = 'running';
  constructor(coords, distance, duration, cadence, marker) {
    super(coords, distance, duration, marker);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
