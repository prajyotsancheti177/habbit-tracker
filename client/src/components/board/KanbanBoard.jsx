import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import GlassCard from '../ui/GlassCard';
import './KanbanBoard.css';

const columns = [
    { id: 'todo', title: 'To Do', icon: '📝' },
    { id: 'in-progress', title: 'In Progress', icon: '🔄' },
    { id: 'done', title: 'Done', icon: '✅' }
];

function KanbanBoard({
    items,
    onDragEnd,
    renderCard,
    emptyMessage = 'No items yet'
}) {
    // Group items by status
    const groupedItems = columns.reduce((acc, col) => {
        acc[col.id] = items
            .filter(item => item.status === col.id)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
        return acc;
    }, {});

    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const { source, destination, draggableId } = result;

        // Find the item
        const item = items.find(i => i._id === draggableId);
        if (!item) return;

        // Create updated items array
        const sourceItems = [...groupedItems[source.droppableId]];
        const destItems = source.droppableId === destination.droppableId
            ? sourceItems
            : [...groupedItems[destination.droppableId]];

        // Remove from source
        sourceItems.splice(source.index, 1);

        // Add to destination
        const updatedItem = { ...item, status: destination.droppableId };
        if (source.droppableId === destination.droppableId) {
            sourceItems.splice(destination.index, 0, updatedItem);
        } else {
            destItems.splice(destination.index, 0, updatedItem);
        }

        // Create updates for backend
        const updates = [];

        // Update source column order
        sourceItems.forEach((item, index) => {
            updates.push({ id: item._id, order: index, status: source.droppableId });
        });

        // Update destination column order (if different)
        if (source.droppableId !== destination.droppableId) {
            destItems.forEach((item, index) => {
                updates.push({ id: item._id, order: index, status: destination.droppableId });
            });
        }

        onDragEnd(updates, updatedItem);
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="kanban-board">
                {columns.map((column) => (
                    <div key={column.id} className="kanban-column">
                        <div className="kanban-column__header">
                            <span className="kanban-column__icon">{column.icon}</span>
                            <h3 className="kanban-column__title">{column.title}</h3>
                            <span className="kanban-column__count">
                                {groupedItems[column.id].length}
                            </span>
                        </div>

                        <Droppable droppableId={column.id}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`kanban-column__content ${snapshot.isDraggingOver ? 'kanban-column__content--dragging' : ''
                                        }`}
                                >
                                    {groupedItems[column.id].length === 0 ? (
                                        <div className="kanban-column__empty">
                                            {emptyMessage}
                                        </div>
                                    ) : (
                                        groupedItems[column.id].map((item, index) => (
                                            <Draggable
                                                key={item._id}
                                                draggableId={item._id}
                                                index={index}
                                            >
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={`kanban-item ${snapshot.isDragging ? 'kanban-item--dragging' : ''
                                                            }`}
                                                    >
                                                        {renderCard(item)}
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))
                                    )}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </div>
                ))}
            </div>
        </DragDropContext>
    );
}

export default KanbanBoard;
