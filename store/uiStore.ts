// UI State Management Store
// Manages all UI overlay states: context menus, tool windows, modals, etc.
// This keeps UI state separate from domain state (canvas, selection)

import { create } from "zustand";

// Context menu state
export interface ContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  targetShapeIds: string[];
}

// Tool window types
export type ToolWindowType = "properties" | "layers" | "history";

export interface ToolWindowState {
  type: ToolWindowType | null;
  targetShapeId: string | null;
  isOpen: boolean;
}

// Modal types
export type ModalType = "export" | "share" | "settings";

export interface ModalState {
  type: ModalType | null;
  isOpen: boolean;
  data?: any;
}

// Toast notification
export interface ToastState {
  isVisible: boolean;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

interface UIStore {
  // Context menu
  contextMenu: ContextMenuState;
  openContextMenu: (
    position: { x: number; y: number },
    shapeIds: string[]
  ) => void;
  closeContextMenu: () => void;

  // Tool windows
  toolWindow: ToolWindowState;
  openToolWindow: (type: ToolWindowType, shapeId?: string) => void;
  closeToolWindow: () => void;

  // Modals
  modal: ModalState;
  openModal: (type: ModalType, data?: any) => void;
  closeModal: () => void;

  // Toast notifications
  toast: ToastState;
  showToast: (message: string, type?: ToastState["type"]) => void;
  hideToast: () => void;

  // Keyboard modifier tracking (for shift-click, etc)
  modifiers: {
    shift: boolean;
    ctrl: boolean;
    meta: boolean;
    alt: boolean;
  };
  setModifier: (key: keyof UIStore["modifiers"], value: boolean) => void;

  // Layer panel state
  layerPanel: {
    isOpen: boolean;
  };
  toggleLayerPanel: () => void;
  setLayerPanelOpen: (isOpen: boolean) => void;

  // Properties panel state
  propertiesPanel: {
    isOpen: boolean;
  };
  togglePropertiesPanel: () => void;
  setPropertiesPanelOpen: (isOpen: boolean) => void;

  // AI panel state
  aiPanel: {
    isOpen: boolean;
  };
  toggleAIPanel: () => void;
  setAIPanelOpen: (isOpen: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  // Context menu initial state
  contextMenu: {
    isOpen: false,
    position: { x: 0, y: 0 },
    targetShapeIds: [],
  },

  openContextMenu: (position, shapeIds) => {
    set({
      contextMenu: {
        isOpen: true,
        position,
        targetShapeIds: shapeIds,
      },
    });
  },

  closeContextMenu: () => {
    set({
      contextMenu: {
        isOpen: false,
        position: { x: 0, y: 0 },
        targetShapeIds: [],
      },
    });
  },

  // Tool window initial state
  toolWindow: {
    type: null,
    targetShapeId: null,
    isOpen: false,
  },

  openToolWindow: (type, shapeId) => {
    set({
      toolWindow: {
        type,
        targetShapeId: shapeId || null,
        isOpen: true,
      },
    });
  },

  closeToolWindow: () => {
    set({
      toolWindow: {
        type: null,
        targetShapeId: null,
        isOpen: false,
      },
    });
  },

  // Modal initial state
  modal: {
    type: null,
    isOpen: false,
    data: undefined,
  },

  openModal: (type, data) => {
    set({
      modal: {
        type,
        isOpen: true,
        data,
      },
    });
  },

  closeModal: () => {
    set({
      modal: {
        type: null,
        isOpen: false,
        data: undefined,
      },
    });
  },

  // Toast initial state
  toast: {
    isVisible: false,
    message: "",
    type: "info",
  },

  showToast: (message, type = "info") => {
    set({
      toast: {
        isVisible: true,
        message,
        type,
      },
    });
  },

  hideToast: () => {
    set((state) => ({
      toast: {
        ...state.toast,
        isVisible: false,
      },
    }));
  },

  // Keyboard modifiers initial state
  modifiers: {
    shift: false,
    ctrl: false,
    meta: false,
    alt: false,
  },

  setModifier: (key, value) => {
    set((state) => ({
      modifiers: {
        ...state.modifiers,
        [key]: value,
      },
    }));
  },

  // Layer panel initial state (defaults to closed)
  layerPanel: {
    isOpen: false,
  },

  toggleLayerPanel: () => {
    set((state) => ({
      layerPanel: {
        isOpen: !state.layerPanel.isOpen,
      },
    }));
  },

  setLayerPanelOpen: (isOpen) => {
    set({
      layerPanel: {
        isOpen,
      },
    });
  },

  // Properties panel initial state (defaults to closed)
  propertiesPanel: {
    isOpen: false,
  },

  togglePropertiesPanel: () => {
    set((state) => ({
      propertiesPanel: {
        isOpen: !state.propertiesPanel.isOpen,
      },
      // Close AI panel when opening properties panel
      aiPanel: {
        isOpen: state.propertiesPanel.isOpen ? state.aiPanel.isOpen : false,
      },
    }));
  },

  setPropertiesPanelOpen: (isOpen) => {
    set((state) => ({
      propertiesPanel: {
        isOpen,
      },
      // Close AI panel when opening properties panel
      aiPanel: {
        isOpen: isOpen ? false : state.aiPanel.isOpen,
      },
    }));
  },

  // AI panel initial state (defaults to closed)
  aiPanel: {
    isOpen: false,
  },

  toggleAIPanel: () => {
    set((state) => ({
      aiPanel: {
        isOpen: !state.aiPanel.isOpen,
      },
      // Close properties panel when opening AI panel
      propertiesPanel: {
        isOpen: state.aiPanel.isOpen ? state.propertiesPanel.isOpen : false,
      },
    }));
  },

  setAIPanelOpen: (isOpen) => {
    set((state) => ({
      aiPanel: {
        isOpen,
      },
      // Close properties panel when opening AI panel
      propertiesPanel: {
        isOpen: isOpen ? false : state.propertiesPanel.isOpen,
      },
    }));
  },
}));
