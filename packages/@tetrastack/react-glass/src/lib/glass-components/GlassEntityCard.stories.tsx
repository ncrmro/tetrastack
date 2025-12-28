import type { Meta, StoryObj } from '@storybook/next-vite';
import { useState } from 'react';
import {
  GlassEntityCard,
  EntityCardTabSelector,
  type EntityCardTab,
} from './GlassEntityCard';

const meta = {
  title: 'Components/GlassEntityCard',
  component: GlassEntityCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
A flexible entity card component with glass-morphism styling. Use this component
for displaying items like meals, recipes, products, or any entity that needs:

- An image thumbnail
- Title and description
- Optional trailing content (tabs, badges)
- Right-side controls (buttons, incrementors)
- Expandable content area

The component supports various interaction modes: static display, link navigation,
selection, and expansion.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant affecting image size and padding',
    },
    expandable: {
      control: 'boolean',
      description: 'Whether the card can be expanded',
    },
    expanded: {
      control: 'boolean',
      description: 'Current expansion state',
    },
    selected: {
      control: 'boolean',
      description: 'Whether the card is selected',
    },
    loading: {
      control: 'boolean',
      description: 'Loading state for expanded content',
    },
  },
} satisfies Meta<typeof GlassEntityCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock image component for stories
const MockImage = ({
  alt,
  color = '#60a5fa',
}: {
  alt: string;
  color?: string;
}) => (
  <div
    className="absolute inset-0 flex items-center justify-center"
    style={{ backgroundColor: color }}
  >
    <span className="text-white text-xs font-medium">{alt[0]}</span>
  </div>
);

/**
 * Basic entity card with image, title, and subtitle
 */
export const Default: Story = {
  args: {
    image: <MockImage alt="Chicken Stir Fry" color="#f97316" />,
    title: 'Chicken Stir Fry',
    subtitle: 'A quick and healthy dinner option with vegetables and rice',
  },
};

/**
 * Card with metadata showing additional information
 */
export const WithMetadata: Story = {
  args: {
    image: <MockImage alt="Pasta Primavera" color="#22c55e" />,
    title: 'Pasta Primavera',
    subtitle: 'Fresh vegetables tossed with pasta in a light garlic sauce',
    metadata: (
      <>
        <span>8 ingredients</span>
        <span>-</span>
        <span className="px-2 py-0.5 font-medium rounded-full bg-primary/10 text-primary">
          Dinner
        </span>
      </>
    ),
  },
};

/**
 * Card with controls on the right side
 */
export const WithControls: Story = {
  args: {
    image: <MockImage alt="Caesar Salad" color="#a855f7" />,
    title: 'Caesar Salad',
    subtitle: 'Classic romaine with parmesan and croutons',
    metadata: <span>5 ingredients</span>,
    controls: (
      <button className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium">
        Add
      </button>
    ),
  },
};

/**
 * Card with trailing content (like tabs or badges)
 */
export const WithTrailingContent: Story = {
  args: {
    image: <MockImage alt="Grilled Salmon" color="#3b82f6" />,
    title: 'Grilled Salmon',
    subtitle: 'Fresh Atlantic salmon with lemon herb butter',
    trailingContent: (
      <div className="flex gap-2">
        <span className="px-2 py-1 text-xs rounded-md bg-surface-container text-on-surface-variant">
          High Protein
        </span>
        <span className="px-2 py-1 text-xs rounded-md bg-surface-container text-on-surface-variant">
          Keto
        </span>
      </div>
    ),
  },
};

/**
 * Small size variant for compact lists
 */
export const SmallSize: Story = {
  args: {
    size: 'sm',
    image: <MockImage alt="Apple" color="#ef4444" />,
    title: 'Apple',
    subtitle: 'Fresh organic apple',
  },
};

/**
 * Large size variant for featured items
 */
export const LargeSize: Story = {
  args: {
    size: 'lg',
    image: <MockImage alt="Holiday Feast" color="#eab308" />,
    title: 'Holiday Feast',
    subtitle:
      'A complete holiday meal featuring roasted turkey, mashed potatoes, and all the trimmings',
    metadata: (
      <>
        <span>12 ingredients</span>
        <span>-</span>
        <span>3 hours prep</span>
      </>
    ),
  },
};

/**
 * Selected state styling
 */
export const Selected: Story = {
  args: {
    image: <MockImage alt="Greek Salad" color="#14b8a6" />,
    title: 'Greek Salad',
    subtitle: 'Fresh Mediterranean vegetables with feta cheese',
    selected: true,
  },
};

/**
 * Interactive card with expandable content
 */
export const Expandable: StoryObj = {
  render: function ExpandableStory() {
    const [expanded, setExpanded] = useState(false);

    return (
      <GlassEntityCard
        image={<MockImage alt="Thai Curry" color="#f59e0b" />}
        title="Thai Green Curry"
        subtitle="Creamy coconut curry with vegetables"
        metadata={<span>10 ingredients</span>}
        expandable
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
        expandedContent={
          <div className="space-y-2 p-4 bg-surface-container/50 rounded-lg">
            <h5 className="font-medium text-on-surface">Ingredients</h5>
            <ul className="text-sm text-on-surface-variant space-y-1">
              <li>400ml Coconut Milk</li>
              <li>2 tbsp Green Curry Paste</li>
              <li>300g Chicken Breast</li>
              <li>1 cup Thai Basil</li>
              <li>2 Kaffir Lime Leaves</li>
            </ul>
          </div>
        }
      />
    );
  },
};

/**
 * Card with loading state for expanded content
 */
export const Loading: Story = {
  args: {
    image: <MockImage alt="Mystery Dish" color="#6366f1" />,
    title: 'Mystery Dish',
    subtitle: 'Loading details...',
    expandable: true,
    expanded: true,
    loading: true,
  },
};

/**
 * Card with custom loading content
 */
export const CustomLoadingContent: Story = {
  args: {
    image: <MockImage alt="Mystery Dish" color="#6366f1" />,
    title: 'Mystery Dish',
    subtitle: 'Loading details...',
    expandable: true,
    expanded: true,
    loading: true,
    loadingContent: (
      <div className="text-center py-6">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
        <p className="text-sm text-on-surface-variant">
          Fetching ingredients...
        </p>
      </div>
    ),
  },
};

// Tab selector stories
const SAMPLE_TABS: EntityCardTab[] = [
  { value: 'ingredients', label: 'Ingredients' },
  { value: 'nutrients', label: 'Nutrients' },
  { value: 'prep', label: 'Prep Steps' },
];

/**
 * Entity card with integrated tab selector
 */
export const WithTabSelector: StoryObj = {
  render: function TabSelectorStory() {
    const [expanded, setExpanded] = useState(true);
    const [activeTab, setActiveTab] = useState('ingredients');

    const tabContent: Record<string, React.ReactNode> = {
      ingredients: (
        <ul className="space-y-2 text-sm">
          <li className="flex justify-between py-2 px-3 bg-surface-container/50 rounded-lg">
            <span>Chicken Breast</span>
            <span className="text-on-surface-variant">300g</span>
          </li>
          <li className="flex justify-between py-2 px-3 bg-surface-container/50 rounded-lg">
            <span>Bell Peppers</span>
            <span className="text-on-surface-variant">2 cups</span>
          </li>
          <li className="flex justify-between py-2 px-3 bg-surface-container/50 rounded-lg">
            <span>Soy Sauce</span>
            <span className="text-on-surface-variant">3 tbsp</span>
          </li>
        </ul>
      ),
      nutrients: (
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-surface-container/50 rounded-lg">
            <div className="text-lg font-semibold text-on-surface">32g</div>
            <div className="text-xs text-on-surface-variant">Protein</div>
          </div>
          <div className="p-3 bg-surface-container/50 rounded-lg">
            <div className="text-lg font-semibold text-on-surface">18g</div>
            <div className="text-xs text-on-surface-variant">Carbs</div>
          </div>
          <div className="p-3 bg-surface-container/50 rounded-lg">
            <div className="text-lg font-semibold text-on-surface">12g</div>
            <div className="text-xs text-on-surface-variant">Fat</div>
          </div>
        </div>
      ),
      prep: (
        <ol className="space-y-2 text-sm list-decimal list-inside">
          <li className="py-2 px-3 bg-surface-container/50 rounded-lg">
            Cut chicken into bite-sized pieces
          </li>
          <li className="py-2 px-3 bg-surface-container/50 rounded-lg">
            Slice bell peppers into strips
          </li>
          <li className="py-2 px-3 bg-surface-container/50 rounded-lg">
            Heat wok over high heat
          </li>
        </ol>
      ),
    };

    return (
      <GlassEntityCard
        image={<MockImage alt="Stir Fry" color="#f97316" />}
        title="Chicken Stir Fry"
        subtitle="Quick and healthy dinner"
        metadata={<span>6 ingredients</span>}
        expandable
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
        trailingContent={
          expanded && (
            <EntityCardTabSelector
              tabs={SAMPLE_TABS}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          )
        }
        controls={
          <button className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium">
            Add
          </button>
        }
        expandedContent={
          <div className="min-h-[120px]">{tabContent[activeTab]}</div>
        }
      />
    );
  },
};

/**
 * Standalone tab selector component
 */
export const TabSelectorStandalone: Story = {
  args: {
    title: 'Tab Selector Demo',
    image: <MockImage alt="Demo" color="#60a5fa" />,
  },
  render: function TabSelectorDemo() {
    const [activeTab, setActiveTab] = useState('ingredients');
    return (
      <div className="p-4">
        <p className="text-sm text-on-surface-variant mb-4">
          Standalone tab selector component:
        </p>
        <EntityCardTabSelector
          tabs={SAMPLE_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
    );
  },
};

/**
 * Card as a link (navigates on click)
 */
export const AsLink: Story = {
  args: {
    image: <MockImage alt="Recipe Link" color="#ec4899" />,
    title: 'Click to View Recipe',
    subtitle: 'This card acts as a link to the recipe detail page',
    href: '#recipe-detail',
  },
};

/**
 * Multiple cards in a list
 */
export const CardList: Story = {
  args: {
    title: 'Card List Demo',
    image: <MockImage alt="Demo" color="#60a5fa" />,
  },
  render: function CardListStory() {
    const meals = [
      {
        id: '1',
        title: 'Chicken Stir Fry',
        subtitle: 'Quick weeknight dinner',
        color: '#f97316',
        ingredients: 6,
      },
      {
        id: '2',
        title: 'Pasta Primavera',
        subtitle: 'Fresh vegetable pasta',
        color: '#22c55e',
        ingredients: 8,
      },
      {
        id: '3',
        title: 'Grilled Salmon',
        subtitle: 'Healthy omega-3 rich meal',
        color: '#3b82f6',
        ingredients: 5,
      },
    ];

    const [selectedId, setSelectedId] = useState<string | null>(null);

    return (
      <div className="space-y-2">
        {meals.map((meal) => (
          <GlassEntityCard
            key={meal.id}
            image={<MockImage alt={meal.title} color={meal.color} />}
            title={meal.title}
            subtitle={meal.subtitle}
            metadata={<span>{meal.ingredients} ingredients</span>}
            selected={selectedId === meal.id}
            onToggle={() =>
              setSelectedId(selectedId === meal.id ? null : meal.id)
            }
            controls={
              <button className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium">
                Add
              </button>
            }
          />
        ))}
      </div>
    );
  },
};
