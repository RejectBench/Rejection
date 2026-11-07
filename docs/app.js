(function () {
  "use strict";
  var C = window.GATE_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };

  // localStorage remembers the link this browser was given (wrapped: storage may be unavailable).
  function loadLink() { try { return JSON.parse(localStorage.getItem("rb-gate") || "null"); } catch (e) { return null; } }
  function saveLink(v) { try { if (v) localStorage.setItem("rb-gate", JSON.stringify(v)); else localStorage.removeItem("rb-gate"); } catch (e) {} }

  // ------------------------------------------------------------ static text
  document.title = C.title || document.title;
  $("title").textContent = C.title || "";
  $("subtitle").textContent = C.subtitle || "";
  $("intro").textContent = C.intro || "";
  (C.privacy || []).forEach(function (t) { var li = document.createElement("li"); li.textContent = t; $("privacy").appendChild(li); });
  var f = $("footer-text");
  f.appendChild(document.createTextNode("Run by " + (C.organizer || "the research team") + "."));
  if (C.contactEmail) {
    f.appendChild(document.createTextNode(" Questions about this study: "));
    var a = document.createElement("a"); a.href = "mailto:" + C.contactEmail; a.textContent = C.contactEmail;
    f.appendChild(a); f.appendChild(document.createTextNode("."));
  }

  // ------------------------------------------------------------ helpers
  function messageFor(r) {
    var contact = C.contactEmail ? " If you think this is wrong, write to " + C.contactEmail + "." : "";
    switch (r.error) {
      case "invalid_email": return "Enter a full email address, like name@university.edu.";
      case "not_academic": return "This address isn’t on our list of universities and research institutes. Use your institutional email." + contact;
      case "captcha_failed": return "The human check didn’t complete. Try it again.";
      case "network": return "Couldn’t reach the server. Check your connection and try again.";
      case "not_configured": return "This page isn’t connected to its server yet (scriptUrl in config.js).";
      default: return "Something went wrong on the server. Try again in a moment." + contact;
    }
  }
  function setError(text, focus) { $("email-error").textContent = text || ""; if (text && focus) $("email").focus(); }

  async function api(payload) {
    if (!C.scriptUrl || /REPLACE_WITH/.test(C.scriptUrl)) return { error: "not_configured" };
    try {
      // No custom headers: a "simple" text/plain POST, which Apps Script web apps accept cross-origin.
      var r = await fetch(C.scriptUrl, { method: "POST", body: JSON.stringify(payload), redirect: "follow" });
      var t = await r.text();
      try { return JSON.parse(t); } catch (e) { return { error: "server_error" }; }
    } catch (e) { return { error: "network" }; }
  }

  var VIEWS = ["email", "go", "message"];
  function show(view, focus) {
    VIEWS.forEach(function (v) { $("view-" + v).hidden = v !== view; });
    if (focus !== false) { var h = $("view-" + view).querySelector("h2"); if (h) h.focus(); }
  }

  // ------------------------------------------------------------ Turnstile (optional)
  var tsToken = "", tsWidget = null;
  if (C.turnstileSiteKey) {
    window.onTurnstileLoad = function () {
      tsWidget = window.turnstile.render("#turnstile", {
        sitekey: C.turnstileSiteKey,
        callback: function (t) { tsToken = t; },
        "expired-callback": function () { tsToken = ""; },
        "error-callback": function () { tsToken = ""; },
      });
    };
    var s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad";
    s.async = true; document.head.appendChild(s);
  }

  // ------------------------------------------------------------ email → server → Qualtrics
  $("email-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    var email = $("email").value.trim();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return setError(messageFor({ error: "invalid_email" }), true);
    if (C.turnstileSiteKey && !tsToken) return setError("Complete the human check above, then continue.");
    var btn = $("send-btn"), label = btn.textContent;
    btn.disabled = true; btn.textContent = "Checking…";
    var r = await api({ action: "enter", email: email, turnstileToken: tsToken });
    btn.disabled = false; btn.textContent = label;
    tsToken = ""; if (window.turnstile && tsWidget !== null) window.turnstile.reset(tsWidget);

    if (r.ok && r.redirect) {
      saveLink({ email: email, redirect: r.redirect });
      return goToSurvey(r.redirect, "new", email);
    }
    if (r.error === "closed") return showClosed();
    setError(messageFor(r), true);
  });

  function goToSurvey(url, mode, email) {
    $("go-link").href = url;
    if (mode === "stored") {
      $("go-title").textContent = "Welcome back";
      $("go-text").textContent = "This browser already entered as " + email +
        ". Continue to the survey; if you started it earlier, Qualtrics will pick up where you left off.";
      $("go-link").textContent = "Continue to the survey";
      return show("go", false);
    }
    $("go-title").textContent = "Thank you";
    $("go-text").textContent = "Taking you to the survey now…";
    $("go-link").textContent = "Go to the survey";
    show("go");
    setTimeout(function () { window.location.assign(url); }, 1200);
  }

  $("go-other").addEventListener("click", function () { saveLink(null); $("email").value = ""; show("email"); $("email").focus(); });
  $("message-back").addEventListener("click", function () { show("email"); $("email").focus(); });

  function showClosed() {
    $("message-title").textContent = "This survey is closed";
    $("message-text").textContent = "We are no longer collecting responses. Thank you to everyone who took part.";
    $("message-back").hidden = true;
    show("message");
  }

  // ------------------------------------------------------------ start
  var stored = loadLink();
  if (stored && stored.redirect) goToSurvey(stored.redirect, "stored", stored.email || "");
  else show("email", false);
  if (/REPLACE_WITH/.test(C.scriptUrl || "")) setError(messageFor({ error: "not_configured" }));
})();
