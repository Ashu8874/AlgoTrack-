import "server-only";

import type { jsPDF } from "jspdf";
import type { PdfReportData, ContestRatingPoint, DailySubmissionPoint, SolvedOverTimePoint } from "./types";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 36;
const MARGIN_TOP = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return new Intl.NumberFormat("en-US").format(value);
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return `${value}%`;
}

function safeText(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim();
  return "--";
}

function ensurePageSpace(doc: jsPDF, y: number, needed: number) {
  if (y + needed > PAGE_HEIGHT - MARGIN_TOP) {
    doc.addPage();
    return MARGIN_TOP;
  }

  return y;
}

function addSectionTitle(doc: jsPDF, title: string, description: string, y: number) {
  y = ensurePageSpace(doc, y, 54);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(20, 20, 20);
  doc.text(title, MARGIN_X, y);
  y += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(90, 90, 90);
  const lines = doc.splitTextToSize(description, CONTENT_WIDTH);
  doc.text(lines, MARGIN_X, y);
  return y + lines.length * 11 + 8;
}

function drawMetricCard(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  value: string,
  detail?: string,
) {
  doc.setDrawColor(225, 228, 235);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(x, y, width, height, 10, 10, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(95, 95, 95);
  doc.text(label, x + 12, y + 14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(25, 25, 25);
  doc.text(value, x + 12, y + 32);
  if (detail) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(110, 110, 110);
    const detailLines = doc.splitTextToSize(detail, width - 24);
    doc.text(detailLines, x + 12, y + 47);
  }
}

function drawBulletList(doc: jsPDF, x: number, y: number, width: number, items: string[]) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(35, 35, 35);

  let cursorY = y;
  for (const item of items.length ? items : ["None available"]) {
    const lines = doc.splitTextToSize(`• ${item}`, width);
    doc.text(lines, x, cursorY);
    cursorY += lines.length * 11 + 3;
  }

  return cursorY;
}

function getChartBounds(x: number, y: number, width: number, height: number) {
  return {
    left: x + 34,
    top: y + 14,
    right: x + width - 14,
    bottom: y + height - 28,
    width: width - 48,
    height: height - 42,
  };
}

function drawChartFrame(doc: jsPDF, x: number, y: number, width: number, height: number, title: string) {
  doc.setDrawColor(225, 228, 235);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(x, y, width, height, 10, 10, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(20, 20, 20);
  doc.text(title, x + 12, y + 14);
  return getChartBounds(x, y + 6, width, height);
}

function drawAxisLabels(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  min: number,
  max: number,
  labels: string[],
) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text(formatNumber(max), x - 4, y + 2, { align: "right" });
  doc.text(formatNumber(min), x - 4, y + height, { align: "right" });

  if (!labels.length) return;

  const step = Math.max(1, Math.floor(labels.length / 4));
  labels.forEach((label, index) => {
    if (index % step !== 0 && index !== labels.length - 1) return;
    const px = x + (labels.length === 1 ? 0 : (width * index) / (labels.length - 1));
    doc.text(label, px, y + height + 12, { align: "center" });
  });
}

function drawLineChart(
  doc: jsPDF,
  data: Array<SolvedOverTimePoint | ContestRatingPoint>,
  valueKey: "solved" | "rating",
  title: string,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const bounds = drawChartFrame(doc, x, y, width, height, title);
  if (!data.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text("No chart data available.", bounds.left, bounds.top + 18);
    return;
  }

  const values = data.map((point) => {
    if (valueKey === "solved" && "solved" in point) return point.solved;
    if (valueKey === "rating" && "rating" in point) return point.rating;
    return 0;
  });
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = data.length > 1 ? bounds.width / (data.length - 1) : 0;

  doc.setDrawColor(232, 235, 241);
  doc.line(bounds.left, bounds.top, bounds.left, bounds.bottom);
  doc.line(bounds.left, bounds.bottom, bounds.right, bounds.bottom);

  doc.setDrawColor(35, 99, 235);
  doc.setLineWidth(1.7);

  let previousX = bounds.left;
  let previousY = bounds.bottom - ((values[0] - min) / range) * bounds.height;
  values.forEach((value, index) => {
    const pointX = bounds.left + stepX * index;
    const pointY = bounds.bottom - ((value - min) / range) * bounds.height;
    if (index > 0) {
      doc.line(previousX, previousY, pointX, pointY);
    }
    doc.setFillColor(35, 99, 235);
    doc.circle(pointX, pointY, 1.7, "F");
    previousX = pointX;
    previousY = pointY;
  });

  drawAxisLabels(
    doc,
    bounds.left,
    bounds.top,
    bounds.width,
    bounds.height,
    min,
    max,
    data.map((point) => point.label),
  );
}

function drawBarChart(
  doc: jsPDF,
  data: DailySubmissionPoint[],
  title: string,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const bounds = drawChartFrame(doc, x, y, width, height, title);
  if (!data.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text("No chart data available.", bounds.left, bounds.top + 18);
    return;
  }

  const max = Math.max(...data.map((point) => point.submissions));
  const stepX = bounds.width / data.length;
  const barWidth = Math.max(8, stepX * 0.58);

  doc.setDrawColor(232, 235, 241);
  doc.line(bounds.left, bounds.top, bounds.left, bounds.bottom);
  doc.line(bounds.left, bounds.bottom, bounds.right, bounds.bottom);

  data.forEach((point, index) => {
    const barHeight = max > 0 ? (point.submissions / max) * bounds.height : 0;
    const barX = bounds.left + index * stepX + (stepX - barWidth) / 2;
    const barY = bounds.bottom - barHeight;

    doc.setFillColor(59, 130, 246);
    doc.roundedRect(barX, barY, barWidth, barHeight, 3, 3, "F");
  });

  drawAxisLabels(
    doc,
    bounds.left,
    bounds.top,
    bounds.width,
    bounds.height,
    0,
    max,
    data.map((point) => point.label),
  );
}

function drawRoadmap(doc: jsPDF, y: number, roadmap: PdfReportData["roadmap"]) {
  y = addSectionTitle(
    doc,
    "Roadmap",
    "A structured improvement plan based on the current profile, weaknesses, and recent performance trend.",
    y,
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(25, 25, 25);
  doc.text(`${roadmap.title} · ${roadmap.timeframe}`, MARGIN_X, y);
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const summaryLines = doc.splitTextToSize(roadmap.summary, CONTENT_WIDTH);
  doc.text(summaryLines, MARGIN_X, y);
  y += summaryLines.length * 11 + 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(25, 25, 25);
  doc.text("Milestones", MARGIN_X, y);
  y += 8;
  roadmap.milestones.forEach((milestone) => {
    y = ensurePageSpace(doc, y, 42);
    doc.setDrawColor(225, 228, 235);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(MARGIN_X, y, CONTENT_WIDTH, 34, 8, 8, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text(milestone.title, MARGIN_X + 10, y + 13);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(85, 85, 85);
    doc.text(doc.splitTextToSize(milestone.description, CONTENT_WIDTH - 20), MARGIN_X + 10, y + 24);
    doc.setTextColor(25, 25, 25);
    y += 42;
  });

  y += 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.text("Weekly Plan", MARGIN_X, y);
  y += 8;
  roadmap.weeklyPlan.forEach((week) => {
    y = ensurePageSpace(doc, y, 76);
    doc.setDrawColor(225, 228, 235);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(MARGIN_X, y, CONTENT_WIDTH, 68, 8, 8, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text(`Week ${week.week}: ${week.focus}`, MARGIN_X + 10, y + 13);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(85, 85, 85);
    doc.text(`Target solved: ${week.targetSolved}`, MARGIN_X + 10, y + 24);
    const objectives = doc.splitTextToSize(`Objectives: ${week.objectives.join("; ")}`, CONTENT_WIDTH - 20);
    const tasks = doc.splitTextToSize(`Tasks: ${week.tasks.join("; ")}`, CONTENT_WIDTH - 20);
    doc.text(objectives, MARGIN_X + 10, y + 34);
    doc.text(tasks, MARGIN_X + 10, y + 46);
    doc.setTextColor(25, 25, 25);
    y += 76;
  });

  y += 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.text("Risks", MARGIN_X, y);
  y += 8;
  y = drawBulletList(doc, MARGIN_X, y, CONTENT_WIDTH, roadmap.risks) + 6;

  return y;
}

function drawInsightSection(doc: jsPDF, y: number, data: PdfReportData) {
  y = addSectionTitle(
    doc,
    "AI Analysis",
    "A structured summary of strengths, weaknesses, readiness, and suggested topics.",
    y,
  );

  const columns = [
    {
      title: "Strengths",
      items: data.aiInsight.strengths,
    },
    {
      title: "Weaknesses",
      items: data.aiInsight.weaknesses,
    },
    {
      title: "Suggested Topics",
      items: data.aiInsight.focusAreas,
    },
  ];

  const columnWidth = (CONTENT_WIDTH - 16) / 3;
  const maxItemCount = Math.max(...columns.map((column) => column.items.length));
  const cardHeight = 44 + maxItemCount * 12;
  columns.forEach((column, index) => {
    const x = MARGIN_X + index * (columnWidth + 8);
    doc.setDrawColor(225, 228, 235);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(x, y, columnWidth, cardHeight, 10, 10, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(25, 25, 25);
    doc.text(column.title, x + 10, y + 14);
    drawBulletList(doc, x + 10, y + 26, columnWidth - 20, column.items);
  });

  const readinessY = y + cardHeight + 12;
  y = ensurePageSpace(doc, readinessY, 60);
  doc.setDrawColor(225, 228, 235);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(MARGIN_X, y, CONTENT_WIDTH, 54, 10, 10, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Readiness Score", MARGIN_X + 10, y + 16);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(35, 99, 235);
  doc.text(formatPercent(data.aiInsight.confidence), MARGIN_X + 10, y + 35);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(85, 85, 85);
  doc.text(
    doc.splitTextToSize(data.aiInsight.summary, CONTENT_WIDTH - 120),
    MARGIN_X + 70,
    y + 24,
  );

  return y + 64;
}

export async function generatePdfReport(data: PdfReportData) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  doc.setProperties({
    title: `${data.username} LeetCode Progress Report`,
    subject: "LeetCode progress export",
    author: "LeetCode Progress Analyzer",
  });

  let y = MARGIN_TOP;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(20, 20, 20);
  doc.text(`${data.username} Progress Report`, MARGIN_X, y);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(85, 85, 85);
  doc.text(
    "Generated from public profile data, AI analysis, and roadmap planning for a concise offline summary.",
    MARGIN_X,
    y,
  );
  y += 22;

  const cardWidth = (CONTENT_WIDTH - 16) / 3;
  drawMetricCard(doc, MARGIN_X, y, cardWidth, 66, "Solved", formatNumber(data.solvedTotal), "Accepted problems");
  drawMetricCard(
    doc,
    MARGIN_X + cardWidth + 8,
    y,
    cardWidth,
    66,
    "Ranking",
    formatNumber(data.ranking),
    "LeetCode rank",
  );
  drawMetricCard(
    doc,
    MARGIN_X + (cardWidth + 8) * 2,
    y,
    cardWidth,
    66,
    "Contest Rating",
    formatNumber(data.contestRating),
    "Contest performance",
  );
  y += 82;

  y = addSectionTitle(
    doc,
    "Profile Summary",
    "A compact snapshot of identity and current public performance indicators.",
    y,
  );

  const leftColumnWidth = CONTENT_WIDTH * 0.56;
  const rightColumnWidth = CONTENT_WIDTH - leftColumnWidth - 12;

  doc.setDrawColor(225, 228, 235);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(MARGIN_X, y, leftColumnWidth, 112, 10, 10, "FD");
  doc.roundedRect(MARGIN_X + leftColumnWidth + 12, y, rightColumnWidth, 112, 10, 10, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(25, 25, 25);
  doc.text("Identity", MARGIN_X + 10, y + 14);
  doc.text("Contest Snapshot", MARGIN_X + leftColumnWidth + 22, y + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(55, 55, 55);
  const identityLines = [
    `Name: ${safeText(data.profile.profile?.realName ?? data.username)}`,
    `Company: ${safeText(data.profile.profile?.company)}`,
    `Job title: ${safeText(data.profile.profile?.jobTitle)}`,
    `Country: ${safeText(data.profile.profile?.countryName)}`,
  ];
  doc.text(identityLines, MARGIN_X + 10, y + 32);

  const contestLines = [
    `Badge: ${safeText(data.contest.matchedUser?.contestBadge?.name)}`,
    `Top percentage: ${formatPercent(data.contest.userContestRanking?.topPercentage)}`,
    `Active years: ${
      data.submissionCalendar.matchedUser?.userCalendar?.activeYears.length
        ? data.submissionCalendar.matchedUser?.userCalendar?.activeYears.join(", ")
        : "--"
    }`,
    `Streak: ${data.streak === null ? "--" : `${data.streak} days`}`,
  ];
  doc.text(contestLines, MARGIN_X + leftColumnWidth + 22, y + 32);
  y += 128;

  y = drawInsightSection(doc, y, data);

  doc.addPage();
  y = MARGIN_TOP;
  y = addSectionTitle(
    doc,
    "Charts",
    "The report renders summary trends directly in PDF so it can be downloaded and reviewed offline.",
    y,
  );
  drawLineChart(doc, data.solvedOverTime, "solved", "Solved Over Time", MARGIN_X, y, CONTENT_WIDTH, 180);
  y += 196;
  drawLineChart(
    doc,
    data.contestRatingOverTime,
    "rating",
    "Contest Rating Over Time",
    MARGIN_X,
    y,
    CONTENT_WIDTH,
    180,
  );
  y += 196;
  drawBarChart(doc, data.dailySubmissionChart, "Daily Submission Chart", MARGIN_X, y, CONTENT_WIDTH, 180);

  doc.addPage();
  y = MARGIN_TOP;
  y = drawInsightSection(doc, y, data);
  y += 8;
  drawRoadmap(doc, y, data.roadmap);

  return doc.output("arraybuffer");
}
