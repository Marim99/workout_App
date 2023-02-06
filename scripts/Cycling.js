import WorkOut from './Workout.js';

export default class Cycling extends WorkOut {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain, marker) {
    super(coords, distance, duration, marker);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
