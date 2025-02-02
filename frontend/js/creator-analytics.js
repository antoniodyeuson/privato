document.addEventListener('DOMContentLoaded', () => {
  const ctx = document.getElementById('analyticsChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
      datasets: [{
        label: 'Visualizações',
        data: [65, 59, 80, 81, 56, 55],
        borderColor: '#4e73df'
      }]
    }
  });
});
