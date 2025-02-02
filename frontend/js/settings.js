document.getElementById('notificationSettings').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const preferences = {
    purchase: document.getElementById('purchaseNotif').checked,
    reward: document.getElementById('rewardNotif').checked
  };

  await fetch('/api/users/notificationPrefs', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preferences)
  });
});
