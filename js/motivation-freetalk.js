(function () {
  "use strict";

  var why = document.querySelector('[data-sync-id="needs-why"]');
  var primary = document.querySelector("#needs-why-primary");
  var empty = document.querySelector("[data-motivation-empty]");
  var groups = [].slice.call(document.querySelectorAll("[data-motivation]"));
  var order = [];

  if (!why || !primary || !empty || !groups.length) return;

  function selectedValues() {
    return [].slice.call(why.querySelectorAll("[data-sync-option].on")).map(function (option) {
      return option.getAttribute("data-sync-option");
    });
  }

  function dispatchPrimary(value) {
    if (primary.value === value) return;
    primary.value = value;
    primary.dispatchEvent(new Event("input", { bubbles: true }));
    primary.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function render() {
    var value = primary.value;
    var found = false;

    groups.forEach(function (group) {
      var show = group.getAttribute("data-motivation") === value;
      group.hidden = !show;
      if (show) found = true;
    });

    empty.hidden = found;
    empty.textContent = "4ページで学ぶきっかけを選ぶと、ここに質問が表示されます。";
  }

  function reconcileOrder(clickedValue) {
    var selected = selectedValues();

    order = order.filter(function (value) {
      return selected.indexOf(value) !== -1;
    });

    if (clickedValue && selected.indexOf(clickedValue) !== -1 && order.indexOf(clickedValue) === -1) {
      order.push(clickedValue);
    }

    selected.forEach(function (value) {
      if (order.indexOf(value) === -1) order.push(value);
    });

    dispatchPrimary(order[0] || "");
    render();
  }

  why.addEventListener("click", function (event) {
    var option = event.target.closest("[data-sync-option]");
    if (!option || !why.contains(option)) return;
    window.setTimeout(function () {
      reconcileOrder(option.getAttribute("data-sync-option"));
    }, 0);
  });

  primary.addEventListener("input", function () {
    if (primary.value) {
      order = [primary.value].concat(order.filter(function (value) {
        return value !== primary.value;
      }));
    }
    render();
  });
  primary.addEventListener("change", render);

  if (primary.value) order.push(primary.value);
  reconcileOrder();
})();
