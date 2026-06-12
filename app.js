const DATABASE_URL = "https://leads-stacktrace-default-rtdb.firebaseio.com";
const LEADS_ENDPOINT = `${DATABASE_URL}/leads`;

const leadForm = document.querySelector("#leadForm");
const leadIdInput = document.querySelector("#leadId");
const nameInput = document.querySelector("#name");
const linkInput = document.querySelector("#link");
const contactInput = document.querySelector("#contact");
const notesInput = document.querySelector("#notes");
const priorityInput = document.querySelector("#priority");
const leadFormDialog = document.querySelector("#leadFormDialog");
const formModalEyebrow = document.querySelector("#formModalEyebrow");
const formModalTitle = document.querySelector("#formModalTitle");
const closeFormModalButton = document.querySelector("#closeFormModalButton");
const submitButton = document.querySelector("#submitButton");
const cancelEditButton = document.querySelector("#cancelEditButton");
const newLeadButton = document.querySelector("#newLeadButton");
const refreshButton = document.querySelector("#refreshButton");
const searchInput = document.querySelector("#searchInput");
const linkFilter = document.querySelector("#linkFilter");
const notesFilter = document.querySelector("#notesFilter");
const contactFilter = document.querySelector("#contactFilter");
const priorityFilter = document.querySelector("#priorityFilter");
const clearFiltersButton = document.querySelector("#clearFiltersButton");
const leadListShell = document.querySelector(".lead-list-shell");
const leadList = document.querySelector("#leadList");
const emptyState = document.querySelector("#emptyState");
const syncStatus = document.querySelector("#syncStatus");
const totalLeads = document.querySelector("#totalLeads");
const contactLeads = document.querySelector("#contactLeads");
const linkLeads = document.querySelector("#linkLeads");
const priorityLeads = document.querySelector("#priorityLeads");
const leadDetailsDialog = document.querySelector("#leadDetailsDialog");
const closeDetailsModalButton = document.querySelector("#closeDetailsModalButton");
const previousLeadButton = document.querySelector("#previousLeadButton");
const nextLeadButton = document.querySelector("#nextLeadButton");
const detailsLeadName = document.querySelector("#detailsLeadName");
const detailsAvatar = document.querySelector("#detailsAvatar");
const detailsDate = document.querySelector("#detailsDate");
const detailsBadges = document.querySelector("#detailsBadges");
const detailsContact = document.querySelector("#detailsContact");
const detailsLink = document.querySelector("#detailsLink");
const detailsNotes = document.querySelector("#detailsNotes");
const detailsPriorityButton = document.querySelector("#detailsPriorityButton");
const detailsEditButton = document.querySelector("#detailsEditButton");
const detailsDeleteButton = document.querySelector("#detailsDeleteButton");

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short"
});

let leads = [];
let visibleLeads = [];
let activeDetailsLeadId = "";

function endpoint(path = "") {
  return `${LEADS_ENDPOINT}${path}.json`;
}

function setStatus(message, type = "") {
  syncStatus.textContent = message;
  syncStatus.className = `status-pill ${type}`.trim();
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

function normalizeLead(id, data) {
  return {
    id,
    name: data?.name ?? "",
    link: data?.link ?? "",
    contact: data?.contact ?? "",
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
    notes: notesInput.value.trim(),
    priority: priorityInput.checked,
    updatedAt: now
  };
}

function getLeadInitials(name) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "LS";
  }

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function formatLeadDate(timestamp) {
  if (!timestamp) {
    return "";
  }

  return `Atualizado em ${dateFormatter.format(new Date(timestamp))}`;
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
  const payload = getFormLead();

  try {
    if (currentId) {
      await requestFirebase(`/${currentId}`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
    } else {
      await requestFirebase("", {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          createdAt: Date.now()
        })
      });
    }

    closeDialog(leadFormDialog);
    resetForm();
    await loadLeads();
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
        updatedAt: Date.now()
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
  const haystack = normalizeSearchText(`${lead.name} ${lead.link} ${lead.contact} ${lead.notes} ${priorityKeywords}`);
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
  renderLeads();
}

function getFilteredLeads() {
  const term = normalizeSearchText(searchInput.value.trim());

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

function handleLeadRowKeydown(event, leadId) {
  if (event.target !== event.currentTarget) {
    return;
  }

  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  event.preventDefault();
  openLeadDetails(leadId);
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

function renderMetrics() {
  totalLeads.textContent = leads.length;
  contactLeads.textContent = leads.filter((lead) => lead.contact).length;
  linkLeads.textContent = leads.filter((lead) => lead.link).length;
  priorityLeads.textContent = leads.filter((lead) => lead.priority).length;
}

function createMetaChip(text, className = "meta-chip") {
  const chip = document.createElement("span");
  chip.className = className;
  chip.textContent = text;
  return chip;
}

function renderLeadDetails(lead) {
  activeDetailsLeadId = lead.id;
  detailsLeadName.textContent = lead.name || "Lead sem nome";
  detailsAvatar.textContent = getLeadInitials(lead.name || "Lead Stacktrace");
  detailsAvatar.className = lead.priority ? "lead-avatar is-priority-avatar" : "lead-avatar";
  detailsDate.textContent = formatLeadDate(lead.updatedAt || lead.createdAt) || "Sem atualiza\u00e7\u00e3o";

  detailsBadges.innerHTML = "";

  if (lead.priority) {
    detailsBadges.append(createMetaChip("Prioridade", "meta-chip priority-chip"));
  } else {
    detailsBadges.append(createMetaChip("Sem prioridade", "meta-chip is-muted"));
  }

  if (lead.link) {
    detailsBadges.append(createMetaChip("Com link"));
  }

  if (lead.contact) {
    detailsBadges.append(createMetaChip("Com contato"));
  }

  if (lead.notes) {
    detailsBadges.append(createMetaChip("Com obs."));
  }

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
  updateDetailsNavigation();
}

function openLeadDetails(id) {
  const lead = leads.find((item) => item.id === id);

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

function renderLeads() {
  const term = normalizeSearchText(searchInput.value.trim());
  const filteredLeads = getFilteredLeads();
  visibleLeads = filteredLeads;

  renderMetrics();
  leadList.innerHTML = "";
  emptyState.hidden = filteredLeads.length > 0;
  leadListShell.hidden = filteredLeads.length === 0;
  emptyState.textContent = hasActiveFilters(term) ? "Nenhum lead encontrado para os filtros." : "Nenhum lead cadastrado ainda.";

  const fragment = document.createDocumentFragment();

  filteredLeads.forEach((lead) => {
    const row = document.createElement("article");
    row.className = lead.priority ? "lead-row is-priority" : "lead-row";
    row.tabIndex = 0;
    row.title = "Abrir detalhes do lead";
    row.setAttribute("aria-label", `Abrir detalhes do lead ${lead.name || "sem nome"}`);
    row.addEventListener("click", () => openLeadDetails(lead.id));
    row.addEventListener("keydown", (event) => handleLeadRowKeydown(event, lead.id));

    const identity = document.createElement("div");
    identity.className = "lead-identity";

    const avatar = document.createElement("div");
    avatar.className = "lead-avatar";
    avatar.textContent = getLeadInitials(lead.name || "Lead Stacktrace");

    const titleGroup = document.createElement("div");
    titleGroup.className = "lead-title-group";

    const title = document.createElement("h2");
    title.textContent = lead.name || "Lead sem nome";

    const leadHint = document.createElement("span");
    leadHint.className = "lead-date";
    leadHint.textContent = lead.link ? "Link dispon\u00edvel" : "Sem link";

    titleGroup.append(title, leadHint);
    identity.append(avatar, titleGroup);

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

    if (lead.notes) {
      meta.append(createMetaChip("Com obs."));
    }

    const updated = document.createElement("div");
    updated.className = "lead-updated";
    updated.textContent = formatLeadDate(lead.updatedAt || lead.createdAt) || "Sem atualiza\u00e7\u00e3o";

    const actions = document.createElement("div");
    actions.className = "row-actions";
    actions.addEventListener("click", (event) => event.stopPropagation());

    const priorityButton = document.createElement("button");
    priorityButton.className = lead.priority ? "priority-button is-active" : "priority-button";
    priorityButton.type = "button";
    priorityButton.textContent = lead.priority ? "Remover prioridade" : "Priorizar";
    priorityButton.addEventListener("click", () => togglePriority(lead.id));

    const copyButton = document.createElement("button");
    copyButton.className = "secondary-button";
    copyButton.type = "button";
    copyButton.textContent = "Copiar";
    copyButton.title = "Copiar nome do lead";
    copyButton.setAttribute("aria-label", `Copiar nome do lead ${lead.name || "sem nome"}`);
    copyButton.addEventListener("click", () => copyLeadName(lead.name, copyButton));

    const editButton = document.createElement("button");
    editButton.className = "secondary-button";
    editButton.type = "button";
    editButton.textContent = "Editar";
    editButton.addEventListener("click", () => editLead(lead.id));

    const deleteButton = document.createElement("button");
    deleteButton.className = "danger-button";
    deleteButton.type = "button";
    deleteButton.textContent = "Excluir";
    deleteButton.addEventListener("click", () => deleteLead(lead.id));

    actions.append(copyButton, priorityButton, editButton, deleteButton);
    row.append(identity, contact, meta, updated, actions);
    fragment.append(row);
  });

  leadList.append(fragment);

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
refreshButton.addEventListener("click", loadLeads);
searchInput.addEventListener("input", renderLeads);
linkFilter.addEventListener("change", renderLeads);
notesFilter.addEventListener("change", renderLeads);
contactFilter.addEventListener("change", renderLeads);
priorityFilter.addEventListener("change", renderLeads);
clearFiltersButton.addEventListener("click", clearFilters);
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

loadLeads();
