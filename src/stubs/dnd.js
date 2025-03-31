// Stub file for @hello-pangea/dnd
export const DragDropContext = ({ children }) => children;
export const Droppable = ({ children }) => typeof children === 'function' ? children({ droppableProps: {}, innerRef: () => {}, placeholder: null }) : children;
export const Draggable = ({ children }) => typeof children === 'function' ? children({ draggableProps: {}, dragHandleProps: {}, innerRef: () => {} }, {}) : children; 