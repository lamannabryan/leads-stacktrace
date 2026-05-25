const DATABASE_URL = "https://leads-stacktrace-default-rtdb.firebaseio.com";
const LEADS_ENDPOINT = `${DATABASE_URL}/leads`;

const leadForm = document.querySelector("#leadForm");
const leadIdInput = document.querySelector("#leadId");
const nameInput = document.querySelector("#name");
const linkInput = document.querySelector("#link");
const contactInput = document.querySelector("#contact");
const notesInput = document.querySelector("#notes");
const submitButton = document.querySelector("#submitButton");
const cancelEditButton = document.querySelector("#cancelEditButton");
const refreshButton = document.querySelector("#refreshButton");
const searchInput = document.querySelector("#searchInput");
const leadGrid = document.querySelector("#leadGrid");
const emptyState = document.querySelector("#emptyState");
const syncStatus = document.querySelector("#syncStatus");
const totalLeads = document.querySelector("#totalLeads");
const contactLeads = document.querySelector("#contactLeads");
const linkLeads = document.querySelector("#linkLeads");

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short"
});

let leads = [];

function endpoint(path = "") {
  return `${LEADS_ENDPOINT}${path}.json`;
}

function setStatus(message, type = "") {
  syncStatus.textContent = message;
  syncStatus.className = `status-pill ${type}`.trim();
}

function normalizeLead(id, data) {
  return {
    id,
    name: data?.name ?? "",
    link: data?.link ?? "",
    contact: data?.contact ?? "",
    notes: data?.notes ?? "",
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
      .sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));

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
      resetForm();
    }

    await loadLeads();
  } catch (error) {
    console.error(error);
    setStatus("Erro ao excluir", "is-error");
  }
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
  submitButton.textContent = "Atualizar lead";
  cancelEditButton.hidden = false;
  nameInput.focus();
}

function resetForm() {
  leadForm.reset();
  leadIdInput.value = "";
  submitButton.textContent = "Salvar lead";
  cancelEditButton.hidden = true;
}

function leadMatchesSearch(lead, term) {
  const haystack = `${lead.name} ${lead.link} ${lead.contact} ${lead.notes}`.toLowerCase();
  return haystack.includes(term);
}

function renderMetrics() {
  totalLeads.textContent = leads.length;
  contactLeads.textContent = leads.filter((lead) => lead.contact).length;
  linkLeads.textContent = leads.filter((lead) => lead.link).length;
}

function createMetaChip(text, className = "meta-chip") {
  const chip = document.createElement("span");
  chip.className = className;
  chip.textContent = text;
  return chip;
}

function renderLeads() {
  const term = searchInput.value.trim().toLowerCase();
  const filteredLeads = term ? leads.filter((lead) => leadMatchesSearch(lead, term)) : leads;

  renderMetrics();
  leadGrid.innerHTML = "";
  emptyState.hidden = filteredLeads.length > 0;
  emptyState.textContent = term ? "Nenhum lead encontrado para a busca." : "Nenhum lead cadastrado ainda.";

  const fragment = document.createDocumentFragment();

  filteredLeads.forEach((lead) => {
    const card = document.createElement("article");
    card.className = "lead-card";

    const header = document.createElement("div");
    header.className = "lead-card-header";

    const avatar = document.createElement("div");
    avatar.className = "lead-avatar";
    avatar.textContent = getLeadInitials(lead.name || "Lead Stacktrace");

    const titleGroup = document.createElement("div");
    titleGroup.className = "lead-title-group";

    const title = document.createElement("h2");
    title.textContent = lead.name || "Lead sem nome";

    const date = document.createElement("span");
    date.className = "lead-date";
    date.textContent = formatLeadDate(lead.updatedAt || lead.createdAt);

    titleGroup.append(title, date);
    header.append(avatar, titleGroup);

    const meta = document.createElement("div");
    meta.className = "lead-meta";

    if (lead.link) {
      const link = document.createElement("a");
      link.className = "meta-chip";
      link.href = lead.link;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = "Abrir link";
      meta.append(link);
    }

    if (lead.contact) {
      meta.append(createMetaChip(lead.contact));
    }

    if (!lead.link && !lead.contact) {
      meta.append(createMetaChip("Sem contato", "meta-chip is-muted"));
    }

    const notes = document.createElement("p");
    notes.className = "lead-notes";
    notes.textContent = lead.notes || "Sem observa\u00e7\u00f5es.";

    const actions = document.createElement("div");
    actions.className = "card-actions";

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

    actions.append(editButton, deleteButton);
    card.append(header, meta, notes, actions);
    fragment.append(card);
  });

  leadGrid.append(fragment);
}

leadForm.addEventListener("submit", saveLead);
cancelEditButton.addEventListener("click", resetForm);
refreshButton.addEventListener("click", loadLeads);
searchInput.addEventListener("input", renderLeads);

loadLeads();
