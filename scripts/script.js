'use strict';

import Cycling from './Cycling.js';
import Running from './Running.js';
// ! querSelectors
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const sortBtn = document.querySelector('.btn__order');
const zoomBtn = document.querySelector('.btn__zoom');
const deleteAllBtn = document.querySelector('#deleteAll');

// ! App Class
class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];
  #submiter = 'new';
  #markers = [];
  constructor() {
    this._getPosition();
    // get data from local storage
    this._getLocalStorage();
    // event handlers
    if (this.#submiter === 'new') {
      console.log('hii');
      form.addEventListener('submit', this._newWorkOut.bind(this));
    }

    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    sortBtn.addEventListener('click', this._sortWorkouts.bind(this));
    zoomBtn.addEventListener('click', this._zoomMap.bind(this));
    deleteAllBtn.addEventListener('click', this.reset);
  }
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () => {
        alert('could not get your postion');
      });
    }
  }
  _loadMap(pos) {
    const { latitude } = pos.coords;
    const { longitude } = pos.coords;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
    L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputElevation.value =
      inputCadence.value =
        '';
    form.style.display = 'none';

    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWorkOut(e) {
    // this.#submiter = 'new';
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);
    e.preventDefault();

    // get data
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

    const { lat, lng } = this.#mapEvent.latlng;

    let workout;
    // check valid
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('inputs have to be positive number');
      workout = new Running([lat, lng], distance, duration, cadence);
    }
    if (type == 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(duration, distance)
      )
        return alert('inputs have to be positive number');
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    this.#workouts.push(workout);
    console.log(this.#workouts);
    this._renderWorkoutMarker(workout);
    this._renderWorkout(workout);
    // clear input

    this._hideForm();

    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    const newMarker = L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          maxHeight: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();

    // workout.marker = newMarker;
    this.#markers.push(newMarker);
  }
  _renderWorkout(workout) {
    let html = `
    <div class="workout-container" data-id="${workout.id}">
    <span class="workout__icon edit__icon editWorkout" title="edit">✒️</span>
    <span class="workout__icon edit__icon deleteWorkout" title="delete">🗑️</span>
    <li class="workout workout--${workout.type}" >
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
    `;
    if (workout.type === 'running') {
      html += `
      <div class="workout__details">
            <span class="workout__icon">⚡️</span>
           <span class="workout__value">${workout.pace.toFixed(1)}</span> 
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
          </li>
          </div>
      `;
    }
    if (workout.type === 'cycling') {
      html += `
      <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <!-- <span class="workout__value">${workout.speed.toFixed(1)}</span> -->
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevationGain}</span>
      <span class="workout__unit">m</span>
    </div>
    </li>
    </div>
      `;
    }

    form.insertAdjacentHTML('afterend', html); //sibling ele
  }
  _moveToPopup(e) {
    // const workoutEle = e.target.closest('.workout');
    const workoutEle = e.target.closest('.workout-container');
    if (e.target.classList.contains('deleteWorkout')) {
      this._deleteWorkout(workoutEle.dataset.id);
      return;
    }

    if (e.target.classList.contains('editWorkout')) {
      this._editWorkout(workoutEle);
      return;
    }
    if (!workoutEle) return;
    const workout = this.#workouts.find(
      work => work.id === workoutEle.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    //using public interface
    // workout.click();
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }
  _deleteWorkout(workOutId) {
    let workouts = JSON.parse(localStorage.getItem('workouts'));
    workouts = workouts.filter(work => work.id != workOutId);
    localStorage.setItem('workouts', JSON.stringify(workouts));
    document.querySelector(`[data-id="${workOutId}"]`).remove();
    // this.#map.removeLayer(
    //   this.#workouts.find(w => w.id == workout.dataset.id).marker
    // );
  }
  _editWorkout(editWorkout) {
    let list;
    this.#submiter = 'edit';
    const workout = this.#workouts.find(w => w.id === editWorkout.dataset.id);
    this._showForm(this.#mapEvent);
    inputDistance.value = workout.distance;
    inputDuration.value = workout.duration;
    if (workout.type === 'running') inputCadence.value = workout.cadence;
    else inputElevation.value = workout.elevationGain;
    form.addEventListener('submit', function (e) {
      list = JSON.parse(localStorage.getItem('workouts'));
      let workIndex = list.findIndex(w => w.id == editWorkout.dataset.id);
      list[workIndex].distance = +inputDistance.value;
      list[workIndex].duration = +inputDuration.value;
      list[workIndex].cadence = +inputCadence.value;
      localStorage.setItem('workouts', JSON.stringify(list));
    });
    this.#workouts = list;
    // this.#submiter = 'new';
  }
  _sortWorkouts() {
    this.#workouts = this.#workouts.sort((a, b) => {
      return a.duration - b.duration;
    });
    this.#workouts.forEach(work => this._deleteWorkout(work.id));
    this.#workouts.forEach(work => this._renderWorkout(work));
    this._setLocalStorage();
  }
  _zoomMap() {
    let markerBounds = L.latLngBounds([]);
    if (this.#markers.length && this.#markers.length > 0) {
      this.#markers.forEach(marker => {
        markerBounds.extend([marker._latlng.lat, marker._latlng.lng]);
      });
      this.#map.fitBounds(markerBounds);
    }
  }
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
