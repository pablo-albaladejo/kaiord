const $ = (id) => document.getElementById(id);

let storedUserId = null;

const check = () => {
  $("status").className = "status checking";
  $("status").textContent = "Checking...";
  $("check-btn").disabled = true;
  $("hint").style.display = "none";

  chrome.runtime.sendMessage({ action: "ping" }, (res) => {
    $("check-btn").disabled = false;

    const sessionActive = res?.data?.sessionActive;
    const userName = res?.data?.userName;
    storedUserId = res?.data?.userId ?? null;

    if (sessionActive) {
      $("status").className = "status ok";
      $("status").textContent = userName
        ? `Connected \u2014 ${userName}`
        : "Connected to Train2Go";
      $("read-btn").style.display = "block";
    } else {
      $("status").className = "status no";
      $("status").innerHTML =
        'Not connected. Log in to <a href="https://app.train2go.com" target="_blank">Train2Go</a>.';
      $("hint").style.display = "block";
      $("read-btn").style.display = "none";
    }
  });
};

$("check-btn").addEventListener("click", check);

$("read-btn").addEventListener("click", () => {
  if (!storedUserId) return;

  const today = new Date().toISOString().split("T")[0];
  $("activities").textContent = "Loading...";
  $("read-btn").disabled = true;

  chrome.runtime.sendMessage(
    { action: "read-week", date: today, userId: storedUserId },
    (res) => {
      $("read-btn").disabled = false;
      const el = $("activities");

      if (!res?.ok) {
        el.textContent = `Error: ${res?.error}`;
        return;
      }

      const activities = res.data?.activities ?? [];
      if (!activities.length) {
        el.textContent = "No activities planned this week";
        return;
      }

      el.textContent = `${activities.length} activities found`;
    }
  );
});

check();
