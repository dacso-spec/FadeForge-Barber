const form = document.getElementById('booking-form');
const steps = document.querySelectorAll('.booking-step');
const progressSteps = document.querySelectorAll('.progress-step');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const submitBtn = document.getElementById('submit-btn');
const bookingSuccess = document.getElementById('booking-success');

let currentStep = 1;
const totalSteps = 5;

const serviceData = {
  'classic-cut': { name: 'Classic Cut', price: 28, duration: 30 },
  'skin-fade': { name: 'Skin Fade', price: 32, duration: 40 },
  'beard-sculpt': { name: 'Beard Sculpt', price: 15, duration: 20 },
  'hot-towel-shave': { name: 'Hot Towel Shave', price: 22, duration: 30 },
  'cut-beard': { name: 'Cut + Beard', price: 45, duration: 55 },
  'kids-cut': { name: 'Kids Cut', price: 18, duration: 25 }
};

const barberData = {
  'marcus': 'Marcus',
  'james': 'James',
  'alex': 'Alex',
  'any': 'Any Available'
};

const dateInput = document.getElementById('booking-date');
if (dateInput) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dateInput.min = today.toISOString().split('T')[0];
}

function updateProgress() {
  progressSteps.forEach((step, index) => {
    if (index + 1 <= currentStep) {
      step.classList.add('active');
    } else {
      step.classList.remove('active');
    }
  });
}

function showStep(step) {
  steps.forEach((s, index) => {
    if (index + 1 === step) {
      s.classList.add('active');
    } else {
      s.classList.remove('active');
    }
  });

  prevBtn.style.display = step > 1 ? 'inline-block' : 'none';
  nextBtn.style.display = step < totalSteps ? 'inline-block' : 'none';
  submitBtn.style.display = step === totalSteps ? 'inline-block' : 'none';

  updateProgress();
}

function validateStep(step) {
  const currentStepEl = steps[step - 1];
  const inputs = currentStepEl.querySelectorAll('input[required], select[required]');
  
  for (const input of inputs) {
    if (!input.value && !input.checked) {
      input.focus();
      input.closest('.service-card, .barber-card, .form-group')?.classList.add('error');
      return false;
    }
  }

  if (step === 3) {
    const date = document.getElementById('booking-date').value;
    const timeSelected = document.querySelector('input[name="time"]:checked');
    if (!date || !timeSelected) {
      alert('Please select both a date and time slot.');
      return false;
    }
  }

  return true;
}

function generateTimeSlots(date) {
  const timeSlotsContainer = document.getElementById('time-slots');
  if (!date) {
    timeSlotsContainer.innerHTML = '<p class="time-slots-placeholder">Select a date to see available times</p>';
    return;
  }

  const selectedDate = new Date(date);
  const dayOfWeek = selectedDate.getDay();
  
  let startHour = 9;
  let endHour = 19;
  let startMinute = 30;
  
  if (dayOfWeek === 0) { // Sunday
    startHour = 11;
    endHour = 17;
    startMinute = 0;
  } else if (dayOfWeek === 6) { // Saturday
    startHour = 9;
    endHour = 18;
    startMinute = 0;
  } else if (dayOfWeek === 1) { // Monday
    startMinute = 30;
  }

  const slots = [];
  let currentHour = startHour;
  let currentMinute = startMinute;

  while (currentHour < endHour || (currentHour === endHour && currentMinute === 0)) {
    const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    slots.push(timeString);

    currentMinute += 30;
    if (currentMinute >= 60) {
      currentMinute = 0;
      currentHour++;
    }
  }

  if (selectedDate.toDateString() === new Date().toDateString()) {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    slots.forEach((slot, index) => {
      const [hours, minutes] = slot.split(':').map(Number);
      const slotTime = hours * 60 + minutes;
      if (slotTime <= currentTime) {
        slots.splice(index, 1);
      }
    });
  }

  if (slots.length === 0) {
    timeSlotsContainer.innerHTML = '<p class="time-slots-placeholder">No available slots for this date</p>';
    return;
  }

  timeSlotsContainer.innerHTML = slots.map(slot => `
    <label class="time-slot">
      <input type="radio" name="time" value="${slot}" required>
      <span>${slot}</span>
    </label>
  `).join('');
}

function updateSummary() {
  const formData = new FormData(form);
  const service = formData.get('service');
  const barber = formData.get('barber');
  const date = formData.get('date');
  const time = formData.get('time');

  if (service && serviceData[service]) {
    document.getElementById('summary-service').textContent = serviceData[service].name;
    document.getElementById('summary-duration').textContent = `${serviceData[service].duration} minutes`;
    document.getElementById('summary-price').textContent = `£${serviceData[service].price}`;
  }

  if (barber && barberData[barber]) {
    document.getElementById('summary-barber').textContent = barberData[barber];
  }

  if (date) {
    const dateObj = new Date(date);
    document.getElementById('summary-date').textContent = dateObj.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  if (time) {
    document.getElementById('summary-time').textContent = time;
  }
}

if (nextBtn) {
  nextBtn.addEventListener('click', () => {
    if (validateStep(currentStep)) {
      if (currentStep === 4) {
        updateSummary();
      }
      currentStep++;
      showStep(currentStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}

if (prevBtn) {
  prevBtn.addEventListener('click', () => {
    currentStep--;
    showStep(currentStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

if (dateInput) {
  dateInput.addEventListener('change', (e) => {
    generateTimeSlots(e.target.value);
  });
}

document.querySelectorAll('.service-card input[type="radio"]').forEach(radio => {
  radio.addEventListener('change', function() {
    document.querySelectorAll('.service-card').forEach(card => {
      card.classList.remove('selected');
    });
    if (this.checked) {
      this.closest('.service-card').classList.add('selected');
    }
  });
});

document.querySelectorAll('.barber-card input[type="radio"]').forEach(radio => {
  radio.addEventListener('change', function() {
    document.querySelectorAll('.barber-card').forEach(card => {
      card.classList.remove('selected');
    });
    if (this.checked) {
      this.closest('.barber-card').classList.add('selected');
    }
  });
});

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
      return;
    }

    const formData = new FormData(form);
    const bookingData = {
      service: serviceData[formData.get('service')],
      barber: barberData[formData.get('barber')],
      date: formData.get('date'),
      time: formData.get('time'),
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      notes: formData.get('notes') || ''
    };

    console.log('Booking data:', bookingData);

    form.style.display = 'none';
    bookingSuccess.style.display = 'block';
    
    const successDetails = document.getElementById('success-details');
    successDetails.innerHTML = `
      <div class="success-booking-info">
        <p><strong>Service:</strong> ${bookingData.service.name}</p>
        <p><strong>Barber:</strong> ${bookingData.barber}</p>
        <p><strong>Date:</strong> ${new Date(bookingData.date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p><strong>Time:</strong> ${bookingData.time}</p>
        <p><strong>Total:</strong> £${bookingData.service.price}</p>
      </div>
    `;

    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

showStep(1);


