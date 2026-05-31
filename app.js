let hasSubmittedReview = false;

const initIcons = () => {
  if (window.lucide) {
    window.lucide.createIcons({
      attrs: {
        "stroke-width": 2.2
      }
    });
  }
};

const replaceIcon = (oldIcon, iconName, extraAttrs = {}) => {
  if (!oldIcon) {
    return;
  }

  const newIcon = document.createElement("i");
  newIcon.setAttribute("data-lucide", iconName);
  newIcon.setAttribute("aria-hidden", "true");

  Object.entries(extraAttrs).forEach(([key, value]) => {
    newIcon.setAttribute(key, value);
  });

  oldIcon.replaceWith(newIcon);
  initIcons();
};

const swapIcon = (button, iconName) => {
  replaceIcon(button.querySelector("svg, i"), iconName);
};

const setButtonState = (button, activeLabel, inactiveLabel, iconName) => {
  const label = button.querySelector("span");
  const isActive = button.classList.toggle("is-active");

  label.textContent = isActive ? activeLabel : inactiveLabel;
  button.setAttribute("aria-pressed", String(isActive));

  if (iconName) {
    swapIcon(button, isActive ? "check" : iconName);
  }
};

const setModalOpenState = () => {
  const isAnyModalOpen = [...document.querySelectorAll(".floating-overlay, .review-overlay")]
    .some((modal) => !modal.hidden);
  document.body.classList.toggle("modal-open", isAnyModalOpen);
};

const openInsightsWindow = () => {
  const insightsWindow = document.querySelector("#insightsWindow");
  const lockedView = document.querySelector("[data-locked-view]");
  const unlockedView = document.querySelector("[data-unlocked-view]");
  const statusIcon = document.querySelector("[data-floating-status-icon]");
  const statusAttrs = { "data-floating-status-icon": "" };

  lockedView.hidden = hasSubmittedReview;
  unlockedView.hidden = !hasSubmittedReview;
  replaceIcon(statusIcon, hasSubmittedReview ? "badge-check" : "lock", statusAttrs);

  insightsWindow.hidden = false;
  setModalOpenState();
  initIcons();
};

const closeInsightsWindow = () => {
  const insightsWindow = document.querySelector("#insightsWindow");
  insightsWindow.hidden = true;
  setModalOpenState();
};

const openReviewModal = () => {
  closeInsightsWindow();
  document.querySelector("#reviewModal").hidden = false;
  setModalOpenState();
  initIcons();
};

const closeReviewModal = () => {
  const reviewModal = document.querySelector("#reviewModal");
  const courseMenu = document.querySelector("[data-course-menu]");

  reviewModal.hidden = true;
  courseMenu.hidden = true;
  document.querySelector("[data-action='toggle-course-list']").setAttribute("aria-expanded", "false");
  setModalOpenState();
};

const updateFabUnlockedState = () => {
  const title = document.querySelector("[data-fab-title]");
  const subtitle = document.querySelector("[data-fab-subtitle]");
  const icon = document.querySelector(".fab-icon svg, .fab-icon i");

  title.textContent = "Peer Insights";
  subtitle.textContent = "type to open";
  replaceIcon(icon, "users-round");
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const setupDraggableFab = (button) => {
  const dragState = {
    didDrag: false,
    offsetX: 0,
    offsetY: 0,
    pointerId: null,
    startX: 0,
    startY: 0
  };

  const moveButton = (clientX, clientY) => {
    const rect = button.getBoundingClientRect();
    const margin = 8;
    const left = clamp(clientX - dragState.offsetX, margin, window.innerWidth - rect.width - margin);
    const top = clamp(clientY - dragState.offsetY, margin, window.innerHeight - rect.height - margin);

    button.style.left = `${left}px`;
    button.style.top = `${top}px`;
    button.style.right = "auto";
    button.style.bottom = "auto";
  };

  button.addEventListener("pointerdown", (event) => {
    if (event.button !== undefined && event.button !== 0) {
      return;
    }

    const rect = button.getBoundingClientRect();
    dragState.pointerId = event.pointerId;
    dragState.didDrag = false;
    dragState.startX = event.clientX;
    dragState.startY = event.clientY;
    dragState.offsetX = event.clientX - rect.left;
    dragState.offsetY = event.clientY - rect.top;

    button.classList.add("is-dragging");
    button.setPointerCapture(event.pointerId);
  });

  button.addEventListener("pointermove", (event) => {
    if (dragState.pointerId !== event.pointerId) {
      return;
    }

    const travel = Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY);
    dragState.didDrag = dragState.didDrag || travel > 4;
    moveButton(event.clientX, event.clientY);
  });

  const finishDrag = (event) => {
    if (dragState.pointerId !== event.pointerId) {
      return;
    }

    dragState.pointerId = null;
    button.classList.remove("is-dragging");
    button.releasePointerCapture(event.pointerId);
  };

  button.addEventListener("pointerup", finishDrag);
  button.addEventListener("pointercancel", finishDrag);

  button.addEventListener("click", (event) => {
    if (!dragState.didDrag) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    dragState.didDrag = false;
  });

  window.addEventListener("resize", () => {
    const rect = button.getBoundingClientRect();
    const margin = 8;

    if (!button.style.left || !button.style.top) {
      return;
    }

    button.style.left = `${clamp(rect.left, margin, window.innerWidth - rect.width - margin)}px`;
    button.style.top = `${clamp(rect.top, margin, window.innerHeight - rect.height - margin)}px`;
  });
};

const setCourseMenuOpen = (isOpen) => {
  const menu = document.querySelector("[data-course-menu]");
  const button = document.querySelector("[data-action='toggle-course-list']");

  menu.hidden = !isOpen;
  button.setAttribute("aria-expanded", String(isOpen));
};

const updateWorkloadOutput = (range) => {
  const output = document.querySelector("[data-workload-output]");
  output.value = `${range.value}h`;
  output.textContent = `${range.value}h`;
};

const closeJargonTooltips = (exceptTooltip = null) => {
  let didCloseTooltip = false;

  document.querySelectorAll("[data-jargon-tooltip]").forEach((tooltip) => {
    if (tooltip === exceptTooltip || tooltip.hidden) {
      return;
    }

    tooltip.hidden = true;
    const trigger = document.querySelector(`[aria-controls="${tooltip.id}"]`);

    if (trigger) {
      trigger.removeAttribute("data-tooltip-pinned");
      trigger.setAttribute("aria-expanded", "false");
    }

    didCloseTooltip = true;
  });

  return didCloseTooltip;
};

const setJargonTooltipOpen = (trigger, isOpen) => {
  const tooltipId = trigger.getAttribute("aria-controls");
  const tooltip = tooltipId ? document.querySelector(`#${tooltipId}`) : null;

  if (!tooltip) {
    return;
  }

  if (isOpen) {
    closeJargonTooltips(tooltip);
  }

  tooltip.hidden = !isOpen;
  trigger.setAttribute("aria-expanded", String(isOpen));
};

const setupJargonTooltips = () => {
  document.querySelectorAll("[data-jargon-wrap]").forEach((wrapper) => {
    const trigger = wrapper.querySelector("[data-jargon-trigger]");
    const closeButton = wrapper.querySelector("[data-action='close-jargon-tooltip']");

    wrapper.addEventListener("mouseenter", () => setJargonTooltipOpen(trigger, true));
    wrapper.addEventListener("mouseleave", () => {
      if (!trigger.hasAttribute("data-tooltip-pinned")) {
        setJargonTooltipOpen(trigger, false);
      }
    });
    wrapper.addEventListener("focusout", (event) => {
      if (!wrapper.contains(event.relatedTarget) && !trigger.hasAttribute("data-tooltip-pinned")) {
        setJargonTooltipOpen(trigger, false);
      }
    });

    trigger.addEventListener("focus", () => setJargonTooltipOpen(trigger, true));
    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      const shouldPinTooltip = !trigger.hasAttribute("data-tooltip-pinned");
      trigger.toggleAttribute("data-tooltip-pinned", shouldPinTooltip);
      setJargonTooltipOpen(trigger, shouldPinTooltip);
    });

    closeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      trigger.focus();
      trigger.removeAttribute("data-tooltip-pinned");
      setJargonTooltipOpen(trigger, false);
    });
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest("[data-jargon-wrap]")) {
      closeJargonTooltips();
    }
  });
};

const submitReview = (event) => {
  event.preventDefault();

  const courseInput = document.querySelector("[data-course-input]");
  const courseSelect = document.querySelector("[data-action='toggle-course-list']");
  const textarea = document.querySelector("#experienceText");

  if (!courseInput.value) {
    setCourseMenuOpen(true);
    courseSelect.focus();
    return;
  }

  if (!textarea.value.trim()) {
    textarea.focus();
    textarea.reportValidity();
    return;
  }

  hasSubmittedReview = true;
  updateFabUnlockedState();
  closeReviewModal();
  openInsightsWindow();
};

window.addEventListener("DOMContentLoaded", () => {
  initIcons();

  const planButton = document.querySelector('[data-action="plan"]');
  const bookmarkButton = document.querySelector('[data-action="bookmark"]');
  const openInsightsButton = document.querySelector('[data-action="open-insights"]');
  const closeInsightsButton = document.querySelector('[data-action="close-insights"]');
  const startReviewButton = document.querySelector('[data-action="start-review"]');
  const closeReviewButton = document.querySelector('[data-action="close-review"]');
  const courseSelect = document.querySelector('[data-action="toggle-course-list"]');
  const courseMenu = document.querySelector("[data-course-menu]");
  const courseInput = document.querySelector("[data-course-input]");
  const selectedCourse = document.querySelector("#selected-course");
  const workloadRange = document.querySelector("#workloadRange");
  const formatOptions = document.querySelector("[data-format-options]");
  const reviewForm = document.querySelector("[data-review-form]");

  if (planButton) {
    planButton.setAttribute("aria-pressed", "false");
    planButton.addEventListener("click", () => {
      setButtonState(planButton, "Added to Plan", "Add to Plan", "plus");
    });
  }

  if (bookmarkButton) {
    bookmarkButton.setAttribute("aria-pressed", "false");
    bookmarkButton.addEventListener("click", () => {
      setButtonState(bookmarkButton, "Bookmarked", "Add Bookmark", "bookmark");
    });
  }

  setupDraggableFab(openInsightsButton);
  openInsightsButton.addEventListener("click", openInsightsWindow);
  closeInsightsButton.addEventListener("click", closeInsightsWindow);
  startReviewButton.addEventListener("click", openReviewModal);
  closeReviewButton.addEventListener("click", closeReviewModal);
  reviewForm.addEventListener("submit", submitReview);

  courseSelect.addEventListener("click", () => {
    setCourseMenuOpen(courseMenu.hidden);
  });

  courseMenu.addEventListener("click", (event) => {
    const option = event.target.closest("[data-course]");

    if (!option) {
      return;
    }

    const value = option.getAttribute("data-course");
    selectedCourse.textContent = option.textContent.trim();
    courseInput.value = value;
    courseSelect.classList.toggle("has-value", Boolean(value));
    setCourseMenuOpen(false);
  });

  formatOptions.addEventListener("change", (event) => {
    if (event.target.name !== "format") {
      return;
    }

    formatOptions.querySelectorAll(".format-card").forEach((card) => {
      card.classList.toggle("is-selected", card.contains(event.target));
    });
  });

  workloadRange.addEventListener("input", () => updateWorkloadOutput(workloadRange));
  updateWorkloadOutput(workloadRange);
  setupJargonTooltips();

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    if (closeJargonTooltips()) {
      return;
    }

    setCourseMenuOpen(false);

    if (!document.querySelector("#reviewModal").hidden) {
      closeReviewModal();
      return;
    }

    if (!document.querySelector("#insightsWindow").hidden) {
      closeInsightsWindow();
    }
  });

  document.querySelector("#insightsWindow").addEventListener("click", (event) => {
    if (event.target.id === "insightsWindow") {
      closeInsightsWindow();
    }
  });

  document.querySelector("#reviewModal").addEventListener("click", (event) => {
    if (event.target.id === "reviewModal") {
      closeReviewModal();
    }
  });
});
