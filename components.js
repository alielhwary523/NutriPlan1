// Loading functions
export function showLoading() {
  const loadingOverlay = document.getElementById('app-loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.style.opacity = '1';
    loadingOverlay.style.pointerEvents = 'auto';
  }
}

export function hideLoading(element = document.getElementById('app-loading-overlay')) {
  if (element) {
    element.style.opacity = '0';
    element.style.pointerEvents = 'none';
  }
}

// Notification system
export function showNotification(message, type = 'info') {
  let icon = 'fa-info-circle';
  let bgColor = 'bg-blue-500';
  
  if (type === 'success') {
    icon = 'fa-check-circle';
    bgColor = 'bg-green-500';
  } else if (type === 'error') {
    icon = 'fa-exclamation-circle';
    bgColor = 'bg-red-500';
  } else if (type === 'warning') {
    icon = 'fa-exclamation-triangle';
    bgColor = 'bg-amber-500';
  }
  
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 z-50 transform translate-x-full transition-transform duration-300`;
  notification.innerHTML = `
    <i class="fa-solid ${icon} text-xl"></i>
    <p>${message}</p>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 10);
  
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Sidebar toggle
export function toggleSidebar(sidebar, overlay) {
  sidebar.classList.toggle('-translate-x-full');
  overlay.classList.toggle('hidden');
}

// Format date
export function formatDate(date) {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

// Calculate daily nutrition
export function calculateDailyNutrition(entries) {
  const nutrition = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0
  };
  
  entries.forEach(entry => {
    if (entry.nutrition) {
      nutrition.calories += entry.nutrition.calories || 0;
      nutrition.protein += entry.nutrition.protein || 0;
      nutrition.carbs += entry.nutrition.carbs || 0;
      nutrition.fat += entry.nutrition.fat || 0;
      nutrition.fiber += entry.nutrition.fiber || 0;
      nutrition.sugar += entry.nutrition.sugar || 0;
    }
  });
  
  return nutrition;
}

// Update nutrition progress bars
export function updateNutritionProgress(nutrition) {
  const goals = {
    calories: 2000,
    protein: 50,
    carbs: 250,
    fat: 65
  };
  
  const caloriesPercent = Math.min(100, (nutrition.calories / goals.calories) * 100);
  const caloriesBar = document.querySelector('#foodlog-today-section .bg-emerald-50 .bg-gray-200 div');
  const caloriesText = document.querySelector('#foodlog-today-section .bg-emerald-50 span:last-child');
  if (caloriesBar) caloriesBar.style.width = `${caloriesPercent}%`;
  if (caloriesText) caloriesText.textContent = `${Math.round(nutrition.calories)} / ${goals.calories} kcal`;
  
  const proteinPercent = Math.min(100, (nutrition.protein / goals.protein) * 100);
  const proteinBar = document.querySelector('#foodlog-today-section .bg-blue-50 .bg-gray-200 div');
  const proteinText = document.querySelector('#foodlog-today-section .bg-blue-50 span:last-child');
  if (proteinBar) proteinBar.style.width = `${proteinPercent}%`;
  if (proteinText) proteinText.textContent = `${Math.round(nutrition.protein)} / ${goals.protein} g`;
  
  const carbsPercent = Math.min(100, (nutrition.carbs / goals.carbs) * 100);
  const carbsBar = document.querySelector('#foodlog-today-section .bg-amber-50 .bg-gray-200 div');
  const carbsText = document.querySelector('#foodlog-today-section .bg-amber-50 span:last-child');
  if (carbsBar) carbsBar.style.width = `${carbsPercent}%`;
  if (carbsText) carbsText.textContent = `${Math.round(nutrition.carbs)} / ${goals.carbs} g`;
  
  const fatPercent = Math.min(100, (nutrition.fat / goals.fat) * 100);
  const fatBar = document.querySelector('#foodlog-today-section .bg-purple-50 .bg-gray-200 div');
  const fatText = document.querySelector('#foodlog-today-section .bg-purple-50 span:last-child');
  if (fatBar) fatBar.style.width = `${fatPercent}%`;
  if (fatText) fatText.textContent = `${Math.round(nutrition.fat)} / ${goals.fat} g`;
  
  const loggedItemsCount = document.querySelectorAll('#logged-items-list > div').length;
  const loggedItemsHeader = document.querySelector('#foodlog-today-section h4');
  if (loggedItemsHeader) loggedItemsHeader.textContent = `Logged Items (${loggedItemsCount})`;
}

// Create weekly nutrition chart
export function createWeeklyChart(container, labels, data) {
  if (typeof Plotly === 'undefined') {
    console.error('Plotly is not loaded');
    return;
  }
  
  const caloriesData = data.map(d => d.calories);
  const proteinData = data.map(d => d.protein);
  const carbsData = data.map(d => d.carbs);
  const fatData = data.map(d => d.fat);
  
  const traces = [
    {
      x: labels,
      y: caloriesData,
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Calories',
      line: { color: '#10b981', width: 3 },
      marker: { size: 6 }
    },
    {
      x: labels,
      y: proteinData,
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Protein (g)',
      line: { color: '#3b82f6', width: 3 },
      marker: { size: 6 }
    },
    {
      x: labels,
      y: carbsData,
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Carbs (g)',
      line: { color: '#f59e0b', width: 3 },
      marker: { size: 6 }
    },
    {
      x: labels,
      y: fatData,
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Fat (g)',
      line: { color: '#8b5cf6', width: 3 },
      marker: { size: 6 }
    }
  ];
  
  const layout = {
    title: 'Weekly Nutrition Overview',
    xaxis: { title: 'Day' },
    yaxis: { title: 'Amount' },
    margin: { l: 50, r: 30, b: 50, t: 50, pad: 4 },
    legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.2 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0.02)'
  };
  
  const config = {
    responsive: true,
    displayModeBar: false
  };
  
  Plotly.newPlot(container, traces, layout, config);
}