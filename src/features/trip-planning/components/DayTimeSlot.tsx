import React, { useRef } from 'react';
import { DayItinerary, Activity } from '../types';
import { useDrop } from 'react-dnd';

interface DayTimeSlotProps {
  time: 'morning' | 'afternoon' | 'evening';
  activities: Activity[];
  date: Date;
  onAddActivity: (activity: Activity) => void;
  onRemoveActivity: (activityId: string) => void;
}

export const DayTimeSlot: React.FC<DayTimeSlotProps> = ({
  time,
  activities,
  date,
  onAddActivity,
  onRemoveActivity,
}) => {
  const dropRef = useRef<HTMLDivElement>(null);
  const [{ isOver }, connectDrop] = useDrop(() => ({
    accept: 'activity',
    drop: (item: Activity) => {
      onAddActivity({ ...item, time });
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  // Connect the drop ref
  connectDrop(dropRef);

  return (
    <div
      ref={dropRef}
      className={`p-4 rounded-lg border ${
  isOver ? 'border-brand-500 bg-brand-500/10' : 'border-stroke dark:border-strokedark'
      }`}
    >
      <h4 className="mb-2 font-medium text-black dark:text-white capitalize">
        {time}
      </h4>
      <div className="space-y-2">
        {activities.map((activity) => (
          <ActivityItem
            key={activity.id}
            activity={activity}
            onRemove={() => onRemoveActivity(activity.id)}
          />
        ))}
      </div>
    </div>
  );
};

interface ActivityItemProps {
  activity: Activity;
  onRemove: () => void;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, onRemove }) => {
  return (
    <div className="flex items-center justify-between p-2 bg-white dark:bg-boxdark rounded border border-stroke dark:border-strokedark">
      <div>
        <p className="text-sm font-medium">{activity.title}</p>
        {activity.cost > 0 && (
          <p className="text-xs text-gray-500">${activity.cost}</p>
        )}
      </div>
      <button
        onClick={onRemove}
        className="p-1 text-sm text-danger hover:bg-danger/10 rounded"
      >
        Remove
      </button>
    </div>
  );
};