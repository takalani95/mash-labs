
"use strict";

// Use the local API while testing.
// Change to the Render URL only after deploying and configuring
// the authenticated backend.
const API_BASE_URL = "https://mash-labs-data-audit-api.onrender.com";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Owner session is stored in memory only.
let ownerSessionToken = null;

const loginSection = document.getElementById("owner-login-section");
const loginForm = document.getElementById("owner-login-form");
const passwordInput = document.getElementById("owner-password");
const loginButton = document.getElementById("owner-login-submit");
const loginMessage = document.getElementById("owner-login-message");

const sessionSection = document.getElementById("owner-session-section");
const logoutButton = document.getElementById("owner-logout");
const auditSection = document.getElementById("owner-audit-section");

const form = document.getElementById("audit-form");
const fileInput = document.getElementById("dataset-file");
const submitButton = document.getElementById("audit-submit");
const message = document.getElementById("audit-message");
const results = document.getElementById("audit-results");

const summary = document.getElementById("audit-summary");
const qualityContainer = document.getElementById("audit-quality");
const recommendationsContainer = document.getElementById(
    "audit-recommendations"
);

function showMessage(text) {
    message.textContent = text;
}

function addText(parent, tag, text) {
    const element = document.createElement(tag);
    element.textContent = String(text);
    parent.appendChild(element);
    return element;
}

function setAuthenticated(isAuthenticated) {
    loginSection.hidden = isAuthenticated;
    sessionSection.hidden = !isAuthenticated;
    auditSection.hidden = !isAuthenticated;

    if (!isAuthenticated) {
        ownerSessionToken = null;
        passwordInput.value = "";
        fileInput.value = "";
        results.hidden = true;
        summary.replaceChildren();
        qualityContainer.replaceChildren();
        recommendationsContainer.replaceChildren();
        showMessage("");
    }
}

async function readResponse(response) {
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const detail = typeof data.detail === "string"
            ? data.detail
            : `Request failed (${response.status}).`;

        const error = new Error(detail);
        error.status = response.status;
        throw error;
    }

    return data;
}

// OWNER LOGIN
loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const password = passwordInput.value;

    if (!password) {
        loginMessage.textContent = "Please enter your password.";
        return;
    }

    loginButton.disabled = true;
    loginMessage.textContent = "Signing in...";

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/auth/login`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ password }),
                cache: "no-store"
            }
        );

        const data = await readResponse(response);

        if (typeof data.session_token !== "string" ||
            !data.session_token) {
            throw new Error("No session token was returned.");
        }

        ownerSessionToken = data.session_token;
        passwordInput.value = "";

        setAuthenticated(true);
        loginMessage.textContent = "";

    } catch (error) {
        ownerSessionToken = null;
        loginMessage.textContent = `Login failed: ${error.message}`;
    } finally {
        loginButton.disabled = false;
    }
});

// OWNER LOGOUT
logoutButton.addEventListener("click", async () => {
    const token = ownerSessionToken;

    // Lock the interface immediately.
    setAuthenticated(false);
    loginMessage.textContent = "Signing out...";

    if (token) {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/auth/logout`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    },
                    cache: "no-store"
                }
            );

            await readResponse(response);
            loginMessage.textContent = "Signed out successfully.";
        } catch (error) {
            loginMessage.textContent =
                "Signed out of this browser. Server logout could not be confirmed.";
        }
    }
});

function displayResults(data) {
    summary.replaceChildren();
    qualityContainer.replaceChildren();
    recommendationsContainer.replaceChildren();

    addText(summary, "h4", "Dataset Summary");
    addText(summary, "p", `File: ${data.filename}`);

    const metrics = document.createElement("div");
    metrics.className = "audit-metrics";

    function addMetric(label, value) {
        const card = document.createElement("div");
        card.className = "audit-metric";

        addText(card, "span", label);
        addText(card, "strong", value);

        metrics.appendChild(card);
    }

    addMetric("Rows analysed", data.rows);
    addMetric("Columns analysed", data.columns);
    addMetric("Quality score", data.quality.overall_score);

    summary.appendChild(metrics);

    addText(qualityContainer, "h4", "Data Quality");
    addText(
        qualityContainer,
        "p",
        `Overall score: ${data.quality.overall_score}`
    );
    addText(
        qualityContainer,
        "p",
        `Status: ${data.quality.status}`
    );
    addText(
        qualityContainer,
        "p",
        `Critical issues: ${data.quality.critical_count}`
    );
    addText(
        qualityContainer,
        "p",
        `Warnings: ${data.quality.warning_count}`
    );

    const issues = data.quality.issues || [];

    const findings = document.createElement("div");
    findings.className = "audit-findings";

    addText(findings, "h4", "Detected Quality Issues");

    if (issues.length === 0) {
        addText(findings, "p", "No quality issues detected.");
    }

    for (const issue of issues) {
        const card = document.createElement("article");
        const severity = String(
            issue.severity || "info"
        ).toLowerCase();

        card.className = "audit-issue";

        if (["critical", "warning", "info"].includes(severity)) {
            card.classList.add(`audit-issue--${severity}`);
        }

        const header = document.createElement("div");
        header.className = "audit-issue-header";

        addText(header, "h5", issue.title);

        const badge = addText(
            header,
            "span",
            severity.toUpperCase()
        );

        badge.className = "audit-issue-badge";

        card.appendChild(header);

        addText(card, "p", issue.description);

        if (issue.column) {
            addText(card, "small", `Column: ${issue.column}`);
        }

        if (issue.affected_count != null) {
            addText(
                card,
                "small",
                `Affected records: ${issue.affected_count}`
            );
        }

        findings.appendChild(card);
    }

    qualityContainer.appendChild(findings);

    addText(
        recommendationsContainer,
        "h4",
        "Chart Recommendations"
    );

    const recommendations =
        data.recommendations.recommended || [];

    if (recommendations.length === 0) {
        addText(
            recommendationsContainer,
            "p",
            "No chart recommendations were generated."
        );
    }

    for (const item of recommendations) {
        const card = document.createElement("div");
        card.className = "audit-recommendation";

        addText(card, "h5", item.column);
        addText(card, "p", `Type: ${item.semantic_type}`);
        addText(card, "p", `Chart: ${item.recommended_chart}`);
        addText(card, "p", item.reason);

        recommendationsContainer.appendChild(card);
    }

    results.hidden = false;
}

// AUTHENTICATED DATASET UPLOAD
form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const token = ownerSessionToken;

    if (!token) {
        setAuthenticated(false);
        loginMessage.textContent = "Please sign in first.";
        return;
    }

    const file = fileInput.files[0];

    if (!file) {
        showMessage("Please select a dataset.");
        return;
    }

    const extension = file.name.split(".").pop().toLowerCase();

    if (!["csv", "xlsx"].includes(extension)) {
        showMessage("Only CSV and XLSX files are supported.");
        return;
    }

    if (file.size > MAX_FILE_SIZE) {
        showMessage("The maximum file size is 5 MB.");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    submitButton.disabled = true;
    showMessage("Analysing your dataset...");
    results.hidden = true;

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/audit/owner`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData,
                cache: "no-store"
            }
        );

        const data = await readResponse(response);

        // Ignore results if the owner logged out during the request.
        if (ownerSessionToken !== token) {
            return;
        }

        displayResults(data);
        showMessage("Dataset analysis completed successfully.");

    } catch (error) {
        if (ownerSessionToken !== token) {
            return;
        }

        if (error.status === 401) {
            setAuthenticated(false);
            loginMessage.textContent =
                "Your session has expired. Please sign in again.";
        } else {
            showMessage(`Error: ${error.message}`);
        }
    } finally {
        submitButton.disabled = false;
    }
});

// Always require login after a page refresh.
setAuthenticated(false);
