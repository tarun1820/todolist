const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  const form = document.getElementById('login-form');

  form.addEventListener('submit', function(event) {
    const username = form.elements.username.value;
    const password = form.elements.password.value;

    if (!passwordRegex.test(password)) {
      event.preventDefault();
      alert('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.');
    }

    // You can add additional validation for the username here

  });