import React, { useEffect, useRef } from 'react';
import { Event } from '../data/events';

interface EventCardProps {
  event: Event;
  onClick: () => void;
  isSelected?: boolean;
  showTime?: boolean;
}

export function EventCard({ event, onClick, isSelected = false, showTime = true }: EventCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric' 
    });
  };

  const truncateDescription = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  // Generate random gradient colors on mount
  useEffect(() => {
    if (cardRef.current) {
      // Generate two random hues for gradient
      const h1 = Math.floor(Math.random() * 360);
      const h2 = (h1 + 60 + Math.floor(Math.random() * 240)) % 360;
      
      // Set CSS variables for this specific card
      cardRef.current.style.setProperty('--gradient-h1', h1.toString());
      cardRef.current.style.setProperty('--gradient-h2', h2.toString());
    }
  }, [event.id]);

  return (
    <div
      ref={cardRef}
      className={`event-card group cursor-pointer transition-all duration-300 ${
        isSelected ? 'scale-105 shadow-xl' : 'hover:scale-102 hover:shadow-lg'
      }`}
      onClick={onClick}
      style={{
        // CSS variables will be set by useEffect
        '--gradient-h1': '200',
        '--gradient-h2': '300'
      } as React.CSSProperties}
    >
      {/* Background gradient with blur */}
      <div className="event-card-bg"></div>
      
      {/* Date overlay */}
      <div className="event-card-date">
        {formatDate(event.date)}
      </div>
      
      {/* Event info */}
      <div className="event-card-info">
        <h3 className="event-card-title">
          {event.title}
        </h3>
        <p className="event-card-description">
          {truncateDescription(event.description)}
        </p>
        <div className="event-card-meta">
          <span className="event-card-organizer">{event.organizer}</span>
          {event.location && (
            <span className="event-card-location"> • {event.location.split(', ')[0]}</span>
          )}
        </div>
      </div>
    </div>
  );
}