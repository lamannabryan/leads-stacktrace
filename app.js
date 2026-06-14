const DATABASE_URL = "https://leads-stacktrace-default-rtdb.firebaseio.com";
const LEADS_ENDPOINT = `${DATABASE_URL}/leads`;

const leadForm = document.querySelector("#leadForm");
const leadIdInput = document.querySelector("#leadId");
const nameInput = document.querySelector("#name");
const linkInput = document.querySelector("#link");
const contactInput = document.querySelector("#contact");
const instagramInput = document.querySelector("#instagram");
const whatsappInput = document.querySelector("#whatsapp");
const dealValueInput = document.querySelector("#dealValue");
const notesInput = document.querySelector("#notes");
const priorityInput = document.querySelector("#priority");
const leadFormDialog = document.querySelector("#leadFormDialog");
const formModalEyebrow = document.querySelector("#formModalEyebrow");
const formModalTitle = document.querySelector("#formModalTitle");
const closeFormModalButton = document.querySelector("#closeFormModalButton");
const submitButton = document.querySelector("#submitButton");
const cancelEditButton = document.querySelector("#cancelEditButton");
const newLeadButton = document.querySelector("#newLeadButton");
const quickNewLeadButton = document.querySelector("#quickNewLeadButton");
const refreshButton = document.querySelector("#refreshButton");
const searchInput = document.querySelector("#searchInput");
const linkFilter = document.querySelector("#linkFilter");
const notesFilter = document.querySelector("#notesFilter");
const contactFilter = document.querySelector("#contactFilter");
const priorityFilter = document.querySelector("#priorityFilter");
const clearFiltersButton = document.querySelector("#clearFiltersButton");
const leadListShell = document.querySelector(".lead-list-shell");
const leadList = document.querySelector("#leadList");
const loadMoreLeadsButton = document.querySelector("#loadMoreLeadsButton");
const emptyState = document.querySelector("#emptyState");
const syncStatus = document.querySelector("#syncStatus");
const totalLeads = document.querySelector("#totalLeads");
const contactLeads = document.querySelector("#contactLeads");
const linkLeads = document.querySelector("#linkLeads");
const activePipelineLeads = document.querySelector("#activePipelineLeads");
const pipelineValueLeads = document.querySelector("#pipelineValueLeads");
const instagramLeads = document.querySelector("#instagramLeads");
const whatsappLeads = document.querySelector("#whatsappLeads");
const priorityLeads = document.querySelector("#priorityLeads");
const dashboardPipelineValue = document.querySelector("#dashboardPipelineValue");
const dashboardPipelineSummary = document.querySelector("#dashboardPipelineSummary");
const dashboardFocusCount = document.querySelector("#dashboardFocusCount");
const dashboardFocusSummary = document.querySelector("#dashboardFocusSummary");
const leadDetailsDialog = document.querySelector("#leadDetailsDialog");
const closeDetailsModalButton = document.querySelector("#closeDetailsModalButton");
const previousLeadButton = document.querySelector("#previousLeadButton");
const nextLeadButton = document.querySelector("#nextLeadButton");
const detailsLeadName = document.querySelector("#detailsLeadName");
const detailsDate = document.querySelector("#detailsDate");
const detailsBadges = document.querySelector("#detailsBadges");
const detailsInstagram = document.querySelector("#detailsInstagram");
const detailsWhatsapp = document.querySelector("#detailsWhatsapp");
const detailsDealValue = document.querySelector("#detailsDealValue");
const detailsContact = document.querySelector("#detailsContact");
const detailsLink = document.querySelector("#detailsLink");
const detailsNotes = document.querySelector("#detailsNotes");
const detailsPriorityButton = document.querySelector("#detailsPriorityButton");
const detailsGoogleButton = document.querySelector("#detailsGoogleButton");
const detailsEditButton = document.querySelector("#detailsEditButton");
const detailsDeleteButton = document.querySelector("#detailsDeleteButton");
const randomNoNotesButton = document.querySelector("#randomNoNotesButton");
const themeToggleButton = document.querySelector("#themeToggleButton");
const themeToggleIcon = document.querySelector("#themeToggleIcon");
const themeToggleLabel = document.querySelector("#themeToggleLabel");
const themeColorMeta = document.querySelector("meta[name='theme-color']");
const navTabs = document.querySelectorAll("[data-view]");
const viewPanels = document.querySelectorAll("[data-view-panel]");
const viewLinks = document.querySelectorAll("[data-go-view]");

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short"
});

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const THEME_STORAGE_KEY = "leads-stacktrace-theme";
const THEME_COLORS = {
  light: "#F2E9EA",
  dark: "#555354"
};

const LEAD_CHANNEL_LABELS = {
  instagram: "Instagram",
  whatsapp: "WhatsApp"
};
const MOBILE_LIST_QUERY = "(max-width: 820px)";
const LEAD_RENDER_BATCH_SIZE = 40;
const mobileListQuery = window.matchMedia(MOBILE_LIST_QUERY);

let leads = [];
let visibleLeads = [];
let visibleLeadLimit = LEAD_RENDER_BATCH_SIZE;
let activeDetailsLeadId = "";
let currentTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
let activeView = "dashboard";

function endpoint(path = "") {
  return `${LEADS_ENDPOINT}${path}.json`;
}

function setStatus(message, type = "") {
  syncStatus.textContent = message;
  syncStatus.className = `sync-status ${type}`.trim();
}

function updateThemeButton(theme) {
  const isDark = theme === "dark";

  themeToggleButton.setAttribute("aria-pressed", String(isDark));
  themeToggleButton.setAttribute("aria-label", isDark ? "Usar modo claro" : "Usar modo escuro");
  themeToggleButton.title = isDark ? "Usar modo claro" : "Usar modo escuro";
  themeToggleIcon.textContent = isDark ? "\u2600" : "\u263e";
  themeToggleLabel.textContent = isDark ? "Claro" : "Escuro";
}

function setTheme(theme, shouldPersist = true) {
  currentTheme = theme === "dark" ? "dark" : "light";

  if (currentTheme === "dark") {
    document.documentElement.dataset.theme = "dark";
  } else {
    document.documentElement.removeAttribute("data-theme");
  }

  themeColorMeta?.setAttribute("content", THEME_COLORS[currentTheme]);
  updateThemeButton(currentTheme);

  if (!shouldPersist) {
    return;
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
  } catch (error) {
    console.warn("Nao foi possivel salvar o tema", error);
  }
}

function toggleTheme() {
  setTheme(currentTheme === "dark" ? "light" : "dark");
}

function isCompactLeadList() {
  return mobileListQuery.matches;
}

function resetLeadRenderLimit() {
  visibleLeadLimit = LEAD_RENDER_BATCH_SIZE;
}

function setActiveView(view, shouldScroll = false) {
  activeView = view === "leads" ? "leads" : "dashboard";

  navTabs.forEach((tab) => {
    const isActive = tab.dataset.view === activeView;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));

    if (isActive) {
      tab.setAttribute("aria-current", "page");
    } else {
      tab.removeAttribute("aria-current");
    }
  });

  viewPanels.forEach((panel) => {
    const isActive = panel.dataset.viewPanel === activeView;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
  });

  if (shouldScroll && isCompactLeadList()) {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }
}

function openLeadsView() {
  setActiveView("leads");
}

function openDialog(dialog) {
  if (dialog.open) {
    return;
  }

  if (typeof dialog.showModal === "function") {
    dialog.showModal();
    return;
  }

  dialog.setAttribute("open", "");
}

function closeDialog(dialog) {
  if (typeof dialog.close === "function" && dialog.open) {
    dialog.close();
    return;
  }

  dialog.removeAttribute("open");
}

function parseDealValue(value) {
  const rawValue = String(value ?? "").trim();
  const normalizedValue = rawValue.includes(",")
    ? rawValue.replace(/\./g, "").replace(",", ".")
    : rawValue;
  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
}

function getLeadChannelLabels(lead) {
  return Object.entries(LEAD_CHANNEL_LABELS)
    .filter(([key]) => Boolean(lead?.[key]))
    .map(([, label]) => label);
}

function formatDealValue(value) {
  return currencyFormatter.format(parseDealValue(value));
}

function formatLeadDate(timestamp) {
  if (!timestamp) {
    return "";
  }

  return `Atualizado em ${dateFormatter.format(new Date(timestamp))}`;
}

function normalizeLead(id, data) {
  const legacySource = String(data?.source ?? "");

  return {
    id,
    name: data?.name ?? "",
    link: data?.link ?? "",
    contact: data?.contact ?? "",
    instagram: Boolean(data?.instagram ?? legacySource === "instagram"),
    whatsapp: Boolean(data?.whatsapp ?? legacySource === "whatsapp"),
    dealValue: parseDealValue(data?.dealValue),
    notes: data?.notes ?? "",
    priority: Boolean(data?.priority),
    createdAt: data?.createdAt ?? 0,
    updatedAt: data?.updatedAt ?? 0
  };
}

function getFormLead() {
  const now = Date.now();

  return {
    name: nameInput.value.trim(),
    link: linkInput.value.trim(),
    contact: contactInput.value.trim(),
    instagram: instagramInput.checked,
    whatsapp: whatsappInput.checked,
    dealValue: parseDealValue(dealValueInput.value),
    notes: notesInput.value.trim(),
    priority: priorityInput.checked,
    updatedAt: now
  };
}

function getLeadTime(lead) {
  return lead.updatedAt || lead.createdAt || 0;
}

function sortLeads(a, b) {
  if (a.priority !== b.priority) {
    return Number(b.priority) - Number(a.priority);
  }

  return getLeadTime(b) - getLeadTime(a);
}

async function requestFirebase(path, options = {}) {
  const response = await fetch(endpoint(path), {
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  });

  if (!response.ok) {
    throw new Error(`Erro ${response.status} ao acessar o Firebase`);
  }

  return response.json();
}

async function loadLeads() {
  setStatus("Sincronizando");

  try {
    const data = await requestFirebase();
    leads = Object.entries(data ?? {})
      .map(([id, lead]) => normalizeLead(id, lead))
      .sort(sortLeads);

    resetLeadRenderLimit();
    renderLeads();
    setStatus("Sincronizado", "is-ok");
  } catch (error) {
    console.error(error);
    setStatus("Erro", "is-error");
  }
}

async function saveLead(event) {
  event.preventDefault();

  if (!nameInput.value.trim()) {
    nameInput.focus();
    return;
  }

  submitButton.disabled = true;
  const currentId = leadIdInput.value;
  const isEditing = Boolean(currentId);
  const payload = getFormLead();
  let savedLeadId = currentId;

  try {
    if (isEditing) {
      await requestFirebase(`/${currentId}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...payload,
          stage: null
        })
      });
    } else {
      const createdLead = await requestFirebase("", {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          createdAt: Date.now()
        })
      });

      savedLeadId = createdLead?.name || "";
    }

    await loadLeads();

    closeDialog(leadFormDialog);
    resetForm();

    if (savedLeadId) {
      openLeadDetails(savedLeadId);
    }
  } catch (error) {
    console.error(error);
    setStatus("Erro ao salvar", "is-error");
  } finally {
    submitButton.disabled = false;
  }
}

async function deleteLead(id) {
  const lead = leads.find((item) => item.id === id);
  const shouldDelete = confirm(`Excluir o lead "${lead?.name || "sem nome"}"?`);

  if (!shouldDelete) {
    return;
  }

  try {
    setStatus("Excluindo");
    await requestFirebase(`/${id}`, {
      method: "DELETE"
    });

    if (leadIdInput.value === id) {
      closeDialog(leadFormDialog);
      resetForm();
    }

    if (activeDetailsLeadId === id) {
      closeDialog(leadDetailsDialog);
    }

    await loadLeads();
  } catch (error) {
    console.error(error);
    setStatus("Erro ao excluir", "is-error");
  }
}

async function togglePriority(id) {
  const lead = leads.find((item) => item.id === id);

  if (!lead) {
    return;
  }

  const nextPriority = !lead.priority;
  const shouldRefreshDetails = activeDetailsLeadId === id && leadDetailsDialog.open;

  try {
    setStatus(nextPriority ? "Priorizando" : "Atualizando");
    await requestFirebase(`/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        priority: nextPriority,
        updatedAt: Date.now(),
        stage: null
      })
    });

    if (leadIdInput.value === id) {
      priorityInput.checked = nextPriority;
    }

    await loadLeads();

    if (shouldRefreshDetails) {
      const updatedLead = leads.find((item) => item.id === id);

      if (updatedLead) {
        renderLeadDetails(updatedLead);
      }
    }
  } catch (error) {
    console.error(error);
    setStatus("Erro ao priorizar", "is-error");
  }
}

function openNewLeadModal() {
  openLeadsView();
  resetForm();
  openDialog(leadFormDialog);
  nameInput.focus();
}

function editLead(id) {
  const lead = leads.find((item) => item.id === id);

  if (!lead) {
    return;
  }

  leadIdInput.value = lead.id;
  nameInput.value = lead.name;
  linkInput.value = lead.link;
  contactInput.value = lead.contact;
  instagramInput.checked = Boolean(lead.instagram);
  whatsappInput.checked = Boolean(lead.whatsapp);
  dealValueInput.value = lead.dealValue || "";
  notesInput.value = lead.notes;
  priorityInput.checked = lead.priority;
  formModalEyebrow.textContent = "Editar registro";
  formModalTitle.textContent = "Editar lead";
  submitButton.textContent = "Atualizar lead";
  closeDialog(leadDetailsDialog);
  openDialog(leadFormDialog);
  nameInput.focus();
}

function resetForm() {
  leadForm.reset();
  leadIdInput.value = "";
  instagramInput.checked = false;
  whatsappInput.checked = false;
  dealValueInput.value = "";
  formModalEyebrow.textContent = "Novo registro";
  formModalTitle.textContent = "Cadastrar lead";
  submitButton.textContent = "Salvar lead";
}

function closeFormModal() {
  closeDialog(leadFormDialog);
  resetForm();
}

function normalizeSearchText(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function leadMatchesSearch(lead, term) {
  const priorityKeywords = lead.priority ? "prioridade prioritario prioritarios" : "";
  const channelKeywords = getLeadChannelLabels(lead).join(" ");
  const haystack = normalizeSearchText(`${lead.name} ${lead.link} ${lead.contact} ${lead.notes} ${channelKeywords} ${formatDealValue(lead.dealValue)} ${priorityKeywords}`);
  return haystack.includes(term);
}

function hasLeadField(value) {
  return Boolean(String(value ?? "").trim());
}

function matchesPresenceFilter(hasValue, filterValue) {
  if (filterValue === "with") {
    return hasValue;
  }

  if (filterValue === "without") {
    return !hasValue;
  }

  return true;
}

function leadMatchesFilters(lead) {
  const matchesLink = matchesPresenceFilter(hasLeadField(lead.link), linkFilter.value);
  const matchesNotes = matchesPresenceFilter(hasLeadField(lead.notes), notesFilter.value);
  const matchesContact = matchesPresenceFilter(hasLeadField(lead.contact), contactFilter.value);
  const matchesPriority =
    priorityFilter.value === "all" ||
    (priorityFilter.value === "priority" && lead.priority) ||
    (priorityFilter.value === "normal" && !lead.priority);

  return matchesLink && matchesNotes && matchesContact && matchesPriority;
}

function hasActiveFilters(term) {
  return Boolean(term) ||
    linkFilter.value !== "all" ||
    notesFilter.value !== "all" ||
    contactFilter.value !== "all" ||
    priorityFilter.value !== "all";
}

function clearFilters() {
  searchInput.value = "";
  linkFilter.value = "all";
  notesFilter.value = "all";
  contactFilter.value = "all";
  priorityFilter.value = "all";
  resetLeadRenderLimit();
  renderLeads();
}

function getFilteredLeads() {
  const term = normalizeSearchText(searchInput.value.trim());

  if (!hasActiveFilters(term)) {
    return leads;
  }

  return leads.filter((lead) => {
    const matchesSearch = !term || leadMatchesSearch(lead, term);
    return matchesSearch && leadMatchesFilters(lead);
  });
}

function getDetailsNavigationState() {
  const currentIndex = visibleLeads.findIndex((lead) => lead.id === activeDetailsLeadId);

  return {
    currentIndex,
    previousLead: currentIndex > 0 ? visibleLeads[currentIndex - 1] : null,
    nextLead: currentIndex >= 0 && currentIndex < visibleLeads.length - 1 ? visibleLeads[currentIndex + 1] : null
  };
}

function getLeadDisplayName(lead) {
  return lead?.name || "Lead sem nome";
}

function updateDetailsNavigation() {
  const { previousLead, nextLead } = getDetailsNavigationState();

  previousLeadButton.disabled = !previousLead;
  nextLeadButton.disabled = !nextLead;
  previousLeadButton.title = previousLead ? `Lead anterior: ${getLeadDisplayName(previousLead)}` : "Nenhum lead anterior";
  nextLeadButton.title = nextLead ? `Proximo lead: ${getLeadDisplayName(nextLead)}` : "Nenhum proximo lead";
  previousLeadButton.setAttribute("aria-label", previousLeadButton.title);
  nextLeadButton.setAttribute("aria-label", nextLeadButton.title);
}

function navigateLeadDetails(direction) {
  const { previousLead, nextLead } = getDetailsNavigationState();
  const targetLead = direction < 0 ? previousLead : nextLead;

  if (!targetLead) {
    return;
  }

  renderLeadDetails(targetLead);
}

function getLeadById(id) {
  return leads.find((item) => item.id === id);
}

function handleLeadListClick(event) {
  const target = event.target instanceof Element ? event.target : null;

  if (!target) {
    return;
  }

  const actionButton = target.closest("[data-lead-action]");

  if (actionButton && leadList.contains(actionButton)) {
    const row = actionButton.closest(".lead-row");
    const leadId = row?.dataset.leadId;
    const lead = getLeadById(leadId);

    if (!lead) {
      return;
    }

    if (actionButton.dataset.leadAction === "priority") {
      togglePriority(lead.id);
      return;
    }

    if (actionButton.dataset.leadAction === "copy") {
      copyLeadName(lead.name, actionButton);
      return;
    }

    if (actionButton.dataset.leadAction === "edit") {
      editLead(lead.id);
      return;
    }

    if (actionButton.dataset.leadAction === "delete") {
      deleteLead(lead.id);
      return;
    }

    return;
  }

  if (target.closest(".row-actions")) {
    return;
  }

  const row = target.closest(".lead-row");

  if (!row || !leadList.contains(row)) {
    return;
  }

  openLeadDetails(row.dataset.leadId);
}

function handleLeadListKeydown(event) {
  const target = event.target instanceof Element ? event.target : null;
  const row = target?.closest(".lead-row");

  if (!row || target !== row) {
    return;
  }

  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  event.preventDefault();
  openLeadDetails(row.dataset.leadId);
}

async function writeClipboardText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (error) {
      console.warn(error);
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.append(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  const copied = document.execCommand("copy");
  textarea.remove();

  if (!copied) {
    throw new Error("Nao foi possivel copiar o nome do lead");
  }
}

async function copyLeadName(name, button) {
  const originalText = button.textContent;
  const leadName = name.trim() || "Lead sem nome";

  button.disabled = true;

  try {
    await writeClipboardText(leadName);
    button.textContent = "Copiado";
  } catch (error) {
    console.error(error);
    button.textContent = "Erro";
  } finally {
    window.setTimeout(() => {
      if (!button.isConnected) {
        return;
      }

      button.disabled = false;
      button.textContent = originalText;
    }, 1400);
  }
}

function formatLeadCount(count) {
  return `${count} ${count === 1 ? "lead" : "leads"}`;
}

function renderMetrics() {
  let contactCount = 0;
  let linkCount = 0;
  let instagramCount = 0;
  let whatsappCount = 0;
  let channelCount = 0;
  let pipelineTotalValue = 0;
  let priorityCount = 0;

  leads.forEach((lead) => {
    if (lead.contact) {
      contactCount += 1;
    }

    if (lead.link) {
      linkCount += 1;
    }

    if (lead.instagram) {
      instagramCount += 1;
    }

    if (lead.whatsapp) {
      whatsappCount += 1;
    }

    if (lead.instagram || lead.whatsapp) {
      channelCount += 1;
    }

    pipelineTotalValue += parseDealValue(lead.dealValue);

    if (lead.priority) {
      priorityCount += 1;
    }
  });
  const totalLeadCount = leads.length;

  totalLeads.textContent = totalLeadCount;
  contactLeads.textContent = contactCount;
  linkLeads.textContent = linkCount;
  instagramLeads.textContent = instagramCount;
  whatsappLeads.textContent = whatsappCount;
  activePipelineLeads.textContent = channelCount;
  pipelineValueLeads.textContent = formatDealValue(pipelineTotalValue);
  priorityLeads.textContent = priorityCount;
  dashboardPipelineValue.textContent = formatDealValue(pipelineTotalValue);
  dashboardPipelineSummary.textContent = `${totalLeadCount} ${totalLeadCount === 1 ? "lead cadastrado" : "leads cadastrados"}`;
  dashboardFocusCount.textContent = channelCount;
  dashboardFocusSummary.textContent = channelCount
    ? `${instagramCount} no Instagram e ${whatsappCount} no WhatsApp.`
    : "Sem canais informados.";
}

function createMetaChip(text, className = "meta-chip") {
  const chip = document.createElement("span");
  chip.className = className;
  chip.textContent = text;
  return chip;
}

function appendLeadChannelChips(container, lead) {
  getLeadChannelLabels(lead).forEach((label) => {
    container.append(createMetaChip(label));
  });
}

function renderLeadDetails(lead) {
  activeDetailsLeadId = lead.id;
  detailsLeadName.textContent = lead.name || "Lead sem nome";
  detailsDate.textContent = formatLeadDate(lead.updatedAt || lead.createdAt) || "Sem atualiza\u00e7\u00e3o";

  detailsBadges.innerHTML = "";

  if (lead.priority) {
    detailsBadges.append(createMetaChip("Prioridade", "meta-chip priority-chip"));
  } else {
    detailsBadges.append(createMetaChip("Sem prioridade", "meta-chip is-muted"));
  }

  appendLeadChannelChips(detailsBadges, lead);

  if (lead.link) {
    detailsBadges.append(createMetaChip("Com link"));
  }

  if (lead.contact) {
    detailsBadges.append(createMetaChip("Com contato"));
  }

  if (lead.dealValue) {
    detailsBadges.append(createMetaChip(formatDealValue(lead.dealValue)));
  }

  if (lead.notes) {
    detailsBadges.append(createMetaChip("Com obs."));
  }

  detailsDealValue.textContent = lead.dealValue ? formatDealValue(lead.dealValue) : "Sem valor";
  detailsInstagram.textContent = lead.instagram ? "Sim" : "N\u00e3o";
  detailsWhatsapp.textContent = lead.whatsapp ? "Sim" : "N\u00e3o";
  detailsContact.textContent = lead.contact || "Sem contato";
  detailsLink.innerHTML = "";

  if (lead.link) {
    const link = document.createElement("a");
    link.href = lead.link;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = lead.link;
    detailsLink.append(link);
  } else {
    detailsLink.textContent = "Sem link";
  }

  detailsNotes.textContent = lead.notes || "Sem observa\u00e7\u00f5es.";
  detailsPriorityButton.className = lead.priority ? "priority-button is-active" : "priority-button";
  detailsPriorityButton.textContent = lead.priority ? "Remover prioridade" : "Priorizar";
  detailsGoogleButton.disabled = !lead.name.trim();
  detailsGoogleButton.title = lead.name.trim()
    ? `Pesquisar ${lead.name.trim()} no Google`
    : "Lead sem nome para pesquisar";
  detailsGoogleButton.setAttribute("aria-label", detailsGoogleButton.title);
  updateDetailsNavigation();
}

function openLeadDetails(id) {
  const lead = getLeadById(id);

  if (!lead) {
    return;
  }

  renderLeadDetails(lead);
  openDialog(leadDetailsDialog);
}

function closeDetailsModal() {
  closeDialog(leadDetailsDialog);
  activeDetailsLeadId = "";
}

function searchActiveLeadOnGoogle() {
  const lead = getLeadById(activeDetailsLeadId);
  const leadName = lead?.name.trim();

  if (!leadName) {
    return;
  }

  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(leadName)}`;
  window.open(searchUrl, "_blank", "noopener,noreferrer");
}

function getNoNotesLeads() {
  return leads.filter((lead) => !hasLeadField(lead.notes));
}

function updateRandomNoNotesButton() {
  const candidatesCount = getNoNotesLeads().length;

  randomNoNotesButton.disabled = candidatesCount === 0;
  randomNoNotesButton.title = candidatesCount > 0
    ? "Abrir lead aleatorio sem observacao"
    : "Nenhum lead sem observacao";
  randomNoNotesButton.setAttribute("aria-label", randomNoNotesButton.title);
}

function openRandomLeadWithoutNotes() {
  const candidates = getNoNotesLeads();

  if (candidates.length === 0) {
    updateRandomNoNotesButton();
    return;
  }

  const randomIndex = Math.floor(Math.random() * candidates.length);
  openLeadDetails(candidates[randomIndex].id);
}

function updateLoadMoreButton(totalCount, renderedCount) {
  if (!loadMoreLeadsButton) {
    return;
  }

  const remainingCount = totalCount - renderedCount;
  const hasMoreLeads = isCompactLeadList() && remainingCount > 0;

  loadMoreLeadsButton.hidden = !hasMoreLeads;

  if (!hasMoreLeads) {
    return;
  }

  const nextBatchCount = Math.min(LEAD_RENDER_BATCH_SIZE, remainingCount);
  loadMoreLeadsButton.textContent = `Carregar mais ${nextBatchCount} ${nextBatchCount === 1 ? "lead" : "leads"}`;
}

function loadMoreLeads() {
  visibleLeadLimit += LEAD_RENDER_BATCH_SIZE;
  renderLeads();
}

function renderLeadsAfterFilterChange() {
  resetLeadRenderLimit();
  renderLeads();
}

function renderLeads() {
  const term = normalizeSearchText(searchInput.value.trim());
  const filteredLeads = getFilteredLeads();
  const renderedLeads = isCompactLeadList()
    ? filteredLeads.slice(0, visibleLeadLimit)
    : filteredLeads;
  visibleLeads = filteredLeads;

  renderMetrics();
  updateRandomNoNotesButton();
  leadList.innerHTML = "";
  emptyState.hidden = filteredLeads.length > 0;
  leadListShell.hidden = filteredLeads.length === 0;
  emptyState.textContent = hasActiveFilters(term) ? "Nenhum lead encontrado para os filtros." : "Nenhum lead cadastrado ainda.";

  const fragment = document.createDocumentFragment();

  renderedLeads.forEach((lead) => {
    const row = document.createElement("article");
    row.className = lead.priority ? "lead-row is-priority" : "lead-row";
    row.tabIndex = 0;
    row.dataset.leadId = lead.id;
    row.title = "Abrir detalhes do lead";
    row.setAttribute("aria-label", `Abrir detalhes do lead ${lead.name || "sem nome"}`);

    const identity = document.createElement("div");
    identity.className = "lead-identity";

    const titleGroup = document.createElement("div");
    titleGroup.className = "lead-title-group";

    const title = document.createElement("h2");
    title.textContent = lead.name || "Lead sem nome";

    const leadHint = document.createElement("span");
    leadHint.className = "lead-date";
    const leadChannelSummary = getLeadChannelLabels(lead).join(" • ");
    leadHint.textContent = lead.dealValue
      ? formatDealValue(lead.dealValue)
      : leadChannelSummary || "Sem canal";

    titleGroup.append(title, leadHint);
    identity.append(titleGroup);

    const contact = document.createElement("div");
    contact.className = "lead-contact";
    contact.textContent = lead.contact || "Sem contato";

    const meta = document.createElement("div");
    meta.className = "lead-meta";

    if (lead.priority) {
      meta.append(createMetaChip("Prioridade", "meta-chip priority-chip"));
    }

    if (!lead.priority) {
      meta.append(createMetaChip("Normal", "meta-chip is-muted"));
    }

    if (lead.link) {
      meta.append(createMetaChip("Com link"));
    }

    if (lead.contact) {
      meta.append(createMetaChip("Com contato"));
    }

    appendLeadChannelChips(meta, lead);

    if (lead.dealValue) {
      meta.append(createMetaChip(formatDealValue(lead.dealValue)));
    }

    if (lead.notes) {
      meta.append(createMetaChip("Com obs."));
    }

    const updated = document.createElement("div");
    updated.className = "lead-updated";
    updated.textContent = formatLeadDate(lead.updatedAt || lead.createdAt) || "Sem atualiza\u00e7\u00e3o";

    const actions = document.createElement("div");
    actions.className = "row-actions";

    const priorityButton = document.createElement("button");
    priorityButton.className = lead.priority ? "priority-button is-active" : "priority-button";
    priorityButton.type = "button";
    priorityButton.dataset.leadAction = "priority";
    priorityButton.textContent = lead.priority ? "Remover prioridade" : "Priorizar";

    const copyButton = document.createElement("button");
    copyButton.className = "secondary-button";
    copyButton.type = "button";
    copyButton.dataset.leadAction = "copy";
    copyButton.textContent = "Copiar";
    copyButton.title = "Copiar nome do lead";
    copyButton.setAttribute("aria-label", `Copiar nome do lead ${lead.name || "sem nome"}`);

    const editButton = document.createElement("button");
    editButton.className = "secondary-button";
    editButton.type = "button";
    editButton.dataset.leadAction = "edit";
    editButton.textContent = "Editar";

    const deleteButton = document.createElement("button");
    deleteButton.className = "danger-button";
    deleteButton.type = "button";
    deleteButton.dataset.leadAction = "delete";
    deleteButton.textContent = "Excluir";

    actions.append(copyButton, priorityButton, editButton, deleteButton);
    row.append(identity, contact, meta, updated, actions);
    fragment.append(row);
  });

  leadList.append(fragment);
  updateLoadMoreButton(filteredLeads.length, renderedLeads.length);

  if (leadDetailsDialog.open) {
    updateDetailsNavigation();
  }
}

leadForm.addEventListener("submit", saveLead);
cancelEditButton.addEventListener("click", closeFormModal);
closeFormModalButton.addEventListener("click", closeFormModal);
leadFormDialog.addEventListener("click", (event) => {
  if (event.target === leadFormDialog) {
    closeFormModal();
  }
});
leadFormDialog.addEventListener("close", () => {
  if (!submitButton.disabled) {
    resetForm();
  }
});
newLeadButton.addEventListener("click", openNewLeadModal);
quickNewLeadButton.addEventListener("click", openNewLeadModal);
refreshButton.addEventListener("click", loadLeads);
searchInput.addEventListener("input", renderLeadsAfterFilterChange);
linkFilter.addEventListener("change", renderLeadsAfterFilterChange);
notesFilter.addEventListener("change", renderLeadsAfterFilterChange);
contactFilter.addEventListener("change", renderLeadsAfterFilterChange);
priorityFilter.addEventListener("change", renderLeadsAfterFilterChange);
clearFiltersButton.addEventListener("click", clearFilters);
loadMoreLeadsButton?.addEventListener("click", loadMoreLeads);
leadList.addEventListener("click", handleLeadListClick);
leadList.addEventListener("keydown", handleLeadListKeydown);
themeToggleButton.addEventListener("click", toggleTheme);
navTabs.forEach((tab) => {
  tab.addEventListener("click", () => setActiveView(tab.dataset.view, true));
});
viewLinks.forEach((link) => {
  link.addEventListener("click", () => setActiveView(link.dataset.goView, true));
});
closeDetailsModalButton.addEventListener("click", closeDetailsModal);
previousLeadButton.addEventListener("click", () => navigateLeadDetails(-1));
nextLeadButton.addEventListener("click", () => navigateLeadDetails(1));
leadDetailsDialog.addEventListener("click", (event) => {
  if (event.target === leadDetailsDialog) {
    closeDetailsModal();
  }
});
leadDetailsDialog.addEventListener("close", () => {
  activeDetailsLeadId = "";
});
detailsPriorityButton.addEventListener("click", () => {
  if (activeDetailsLeadId) {
    togglePriority(activeDetailsLeadId);
  }
});
detailsGoogleButton.addEventListener("click", searchActiveLeadOnGoogle);
detailsEditButton.addEventListener("click", () => {
  if (activeDetailsLeadId) {
    editLead(activeDetailsLeadId);
  }
});
detailsDeleteButton.addEventListener("click", () => {
  if (activeDetailsLeadId) {
    deleteLead(activeDetailsLeadId);
  }
});
randomNoNotesButton.addEventListener("click", openRandomLeadWithoutNotes);

if (typeof mobileListQuery.addEventListener === "function") {
  mobileListQuery.addEventListener("change", renderLeadsAfterFilterChange);
} else if (typeof mobileListQuery.addListener === "function") {
  mobileListQuery.addListener(renderLeadsAfterFilterChange);
}

document.addEventListener("keydown", (event) => {
  if (!leadDetailsDialog.open) {
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    navigateLeadDetails(-1);
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    navigateLeadDetails(1);
  }
});

if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.warn("Nao foi possivel registrar o service worker", error);
    });
  });
}

setTheme(currentTheme, false);
setActiveView(activeView);
loadLeads();
