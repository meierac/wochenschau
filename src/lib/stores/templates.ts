import { writable } from "svelte/store";
import type { ActivityTemplate } from "../types/index.js";
import {
  getTemplates,
  saveTemplate,
  deleteTemplate,
} from "../utils/storage.js";
import { notifyDataChanged } from "../services/syncTrigger.js";

function createTemplateStore() {
  const { subscribe, update } = writable<ActivityTemplate[]>(getTemplates());

  return {
    subscribe,
    addTemplate: (template: ActivityTemplate) => {
      saveTemplate(template);
      update((templates) => [...templates, template]);
      notifyDataChanged();
    },
    removeTemplate: (id: string) => {
      deleteTemplate(id);
      update((templates) => templates.filter((t) => t.id !== id));
      notifyDataChanged();
    },
    replaceAll: (all: ActivityTemplate[]) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("wochenschau_templates", JSON.stringify(all));
      }
      update(() => all);
      notifyDataChanged();
    },
  };
}

export const templates = createTemplateStore();
