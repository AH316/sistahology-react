import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  to?: string; // If undefined, item is not clickable (current page)
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb" className="bg-white/90 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <ol className="flex items-center space-x-2 text-sm">
          {/* Home icon as first item */}
          <li className="flex items-center">
            <Link
              to="/"
              className="flex items-center text-gray-700 hover:text-sistah-pink transition-colors"
              aria-label="Home"
            >
              <Home className="w-4 h-4" />
            </Link>
          </li>

          {/* Breadcrumb items */}
          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            return (
              <li key={index} className="flex items-center">
                {/* Separator */}
                <ChevronRight className="w-4 h-4 text-gray-600 mx-1" aria-hidden="true" />

                {/* Item */}
                {item.to && !isLast ? (
                  <Link
                    to={item.to}
                    className="text-gray-700 hover:text-sistah-pink transition-colors font-medium"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className="text-sistah-pink font-semibold"
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
};

export default Breadcrumbs;
