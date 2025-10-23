import { writable } from "svelte/store";
import type { ActivityTemplate } from "../types/index.js";
import {
  getTemplates,
  saveTemplate,
  deleteTemplate,
} from "../utils/storage.js";

function createTemplateStore() {
  const { subscribe, update } = writable<ActivityTemplate[]>(getTemplates());

  return {
    subscribe,
    addTemplate: (template: ActivityTemplate) => {
      saveTemplate(template);
      update((templates) => [...templates, template]);
    },
    removeTemplate: (id: string) => {
      deleteTemplate(id);
      update((templates) => templates.filter((t) => t.id !== id));
    },
  };
}

export const templates = createTemplateStore();
