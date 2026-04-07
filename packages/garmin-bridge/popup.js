const $ = (id) => document.getElementById(id);

const check = () => {
  $("status").className = "status checking";
  $("status").textContent = "Checking...";
  $("hint").style.display = "none";

  chrome.runtime.sendMessage({ action: "ping" }, (res) => {
    const apiOk = res?.data?.gcApi?.ok;
    const hasCsrf = res?.data?.csrfCaptured;

    if (apiOk) {
      $("status").className = "status ok";
      $("status").textContent = "Connected to Garmin Connect";
      $("list-btn").style.display = "block";
    } else if (hasCsrf) {
      $("status").className = "status checking";
      $("status").textContent = "CSRF captured, but API returned error";
      $("hint").style.display = "block";
    } else {
      $("status").className = "status no";
      $("status").innerHTML =
        'Not connected. <a href="https://connect.garmin.com" target="_blank">Open Garmin Connect</a> and navigate around.';
      $("hint").style.display = "block";
    }
  });
};

$("check-btn").addEventListener("click", check);

$("list-btn").addEventListener("click", () => {
  $("workouts").textContent = "Loading...";
  chrome.runtime.sendMessage({ action: "list" }, (res) => {
    const el = $("workouts");
    if (!res?.ok) {
      el.textContent = `Error: ${res?.error}`;
      return;
    }
    const workouts = res.data;
    if (!workouts?.length) {
      el.textContent = "No workouts found";
      return;
    }
    el.innerHTML = workouts
      .map(
        (w) => `<div class="workout"><b>${w.workoutName || w.name}</b></div>`
      )
      .join("");
  });
});

check();
