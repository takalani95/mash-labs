
"use strict";

const API_URL = "http://127.0.0.1:8001/api/audit";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

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

    // Detailed data quality findings
    const issues = data.quality.issues || [];

    const findings = document.createElement("div");
    findings.className = "audit-findings";

    addText(findings, "h4", "Detected Quality Issues");

    if (issues.length === 0) {
        addText(findings, "p", "No quality issues detected.");
    }

    for (const issue of issues) {
        const card = document.createElement("article");

        const severity = String(issue.severity || "info").toLowerCase();

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

    const recommendations = data.recommendations.recommended || [];

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

form.addEventListener("submit", async (event) => {
    event.preventDefault();

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
        const response = await fetch(API_URL, {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                typeof data.detail === "string"
                    ? data.detail
                    : "Dataset analysis failed."
            );
        }

        displayResults(data);
        showMessage("Dataset analysis completed successfully.");

    } catch (error) {
        showMessage(`Error: ${error.message}`);
    } finally {
        submitButton.disabled = false;
    }
});
