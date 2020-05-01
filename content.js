//Icon by https://freeicons.io/profile/823.

function httpGet(url, cb) {
  const Http = new XMLHttpRequest();
  Http.open("GET", url);
  Http.send();
  Http.onreadystatechange = function (e) {
    if (this.readyState == 4 && this.status == 200) {
      cb(Http);
    }
  };
}

function selected(el) {
  if (el && el.classList.contains("ghx-selected")) {
    el.style.border = "4px solid #60afff";
    el.style.borderRadius = "6px";
    el.classList.add(["spHighlight"]);
  } else if (el) {
    el.style.border = "unset";
    el.style.borderRadius = "unset";
    el.classList.remove(["spHighlight"]);
  }
}

const ticketsNotToMark = {
  //   10807: "Waiting for Peer Review",
  //   10808: "In Peer Review",
  10101: "In QA Review",
  10102: "Waitng for QA Review",
  10400: "Invalid",
  11900: "Done - passed",
  11901: "Done - failed",
  10002: "Done",
};

let isRunning = false;

//https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
// Select the node that will be observed for mutations
const targetNode = document.getElementById("ghx-work");
// Options for the observer (which mutations to observe)
const config = { childList: true, subtree: true };
// Callback function to execute when mutations are observed
const callback = function (mutationsList, observer) {
  run();
};
// Create an observer instance linked to the callback function
const observer = new MutationObserver(callback);
// Start observing the target node for configured mutations
function startObserving() {
  observer.observe(targetNode, config);
}

let isBacklogView = false;

function run() {
  observer.disconnect();
  if (isRunning) return;
  console.log("RUN Effiecient Jira");
  isRunning = true;
  let boardId = window.location?.search?.replace(/\?/g, "");
  const parts = boardId.split("&");
  boardId = parts.find((term) => term.indexOf("rapidView") != -1);
  boardId = boardId.split("=")[1];
  const view = parts.find((term) => term.indexOf("view") != -1);
  if (view) isBacklogView = view.split("=")[1].indexOf("planning") != -1;

  httpGet(
    `${window.location.origin}/rest/agile/1.0/board/${boardId}/sprint?state=active`,
    (http) => {
      const data = JSON.parse(http.responseText);
      const sprintId = data?.values[0]?.id;
      getIssuesForSprint(sprintId);
    }
  );
}

function setStatusColor(sideBar, priority) {
  const lower = priority == 3 || priority == 5;
  let color = priority == 4 || priority == 5 ? "green" : "red";
  if (priority == 1) color = "black";
  const height = lower ? "50%" : "100%";
  let bar = `<div style="width:100%;height:${height};background-color:${color};"></div>`;
  sideBar.innerHTML = lower ? `<div style="height:25%;"></div>${bar}` : bar;
  sideBar.style.width = "8px";
}
const colors = {
  1: "#f15c75",
  2: "#f15c75",
  3: "#f79232",
  4: "#8eb021",
  5: "#3b7fc4",
};
function setPriorityLabel(fieldArea, priority) {
  const specialField = isBacklogView
    ? document.createElement("span")
    : document.createElement("div");
  const style = `width:90%;background:${colors[priority]};height:10px;border-radius:4px;`;
  if (isBacklogView) {
    specialField.classList.add(
      "aui-label",
      "ghx-label",
      "ghx-label-double",
      "ghx-label-4",
      "specialColorField"
    );
    specialField.style.width = "100px";
    specialField.style.backgroundColor = colors[priority];
    specialField.style.height = "10px";
    specialField.style.borderRadius = "4px";
    specialField.style.border = "0";
    fieldArea.insertBefore(specialField, fieldArea.lastChild);
  } else {
    specialField.classList.add("ghx-highlighted-fields", "specialColorField");
    specialField.innerHTML = `<div class="ghx-highlighted-field" style="${style}"></div>`;
    fieldArea.appendChild(specialField);
  }
}

function getIssuesForSprint(sprintId) {
  httpGet(
    `${window.location.origin}/rest/agile/1.0/sprint/${sprintId}/issue?maxResults=200`,
    (Http) => {
      const response = JSON.parse(Http.responseText);
      const issues = response.issues;
      issues.forEach((issue) => {
        if (ticketsNotToMark[issue?.fields?.status?.id]) return;
        const ticketKey = issue.key;
        let blocked = false;
        const isAssigned = Boolean(issue?.fields?.assignee);

        const hasIsBlockedByLink = issue?.fields?.issuelinks?.filter((link) =>
          link.type.inward == "is blocked by" ? true : false
        );
        if (hasIsBlockedByLink?.length) {
          const linkIsNotDone = hasIsBlockedByLink.filter((link) => {
            const blockedByStatus = link?.inwardIssue?.fields?.status.name;
            if (!link?.inwardIssue) return false;
            return (
              blockedByStatus != "Done" &&
              blockedByStatus.indexOf("QA Review") == -1
            );
          });
          if (linkIsNotDone?.length) blocked = true;
        }
        const els = document.querySelectorAll(
          `[data-issue-key="${ticketKey}"]`
        );
        const el = els.length ? els[0] : null;
        if (el) {
          if (blocked) el.style.backgroundColor = "#fdbcbc";
          else if (isAssigned) el.style.background = "#eae9e9";
          else {
            el.style.boxShadow = "1px 1px 10px green";
            el.style.zIndex = "1";
          }

          const priority = issue?.fields?.priority?.id;
          //   const sideBar = el.getElementsByClassName("ghx-grabber")[0];
          //   if (sideBar && priority >= 0) setStatusColor(sideBar, priority);

          const fieldArea = isBacklogView
            ? el.getElementsByClassName("ghx-row-version-epic-subtasks")[0]
            : el.getElementsByClassName("ghx-issue-fields")[0];
          if (fieldArea?.getElementsByClassName("specialColorField").length)
            fieldArea.getElementsByClassName("specialColorField")[0].remove();
          if (fieldArea && priority) setPriorityLabel(fieldArea, priority);
          if (isBacklogView) selected(el);
        }
      });
      isRunning = false;
      console.log("DONE Effiecient Jira");
      startObserving();
    }
  );
}
run();

//Handle faster slected ticket changes
const tickets = document.getElementsByClassName("ghx-issue");
for (const ticket of tickets) {
  ticket.onmouseup = () => {
    const alreadySelected = document.getElementsByClassName("spHighlight");
    for (const el of alreadySelected) {
      el.style.border = "unset";
      el.style.borderRadius = "unset";
      el.classList.remove(["spHighlight"]);
    }
    setTimeout(() => selected(ticket), 200);
  };
}
