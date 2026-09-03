import R from 'ramda';
import React, { useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  restrictToHorizontalAxis,
  restrictToParentElement,
} from '@dnd-kit/modifiers';

import Icon from '../../core/components/Icon.jsx';
import * as Actions from '../actions.js';
import * as Selectors from '../selectors.js';
import * as UserSelectors from '../../user/selectors.js';
import { assocIndexes, indexById } from '../../utils/array.js';
import TabsContainer from '../components/TabsContainer.jsx';
import TabsItem from '../components/TabsItem.jsx';
import SidebarSwitches from '../components/SidebarSwitches.jsx';

import { SIDEBAR_IDS } from '../constants.js';

function SortableTabItem({ value, onClick, onClose }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: value.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TabsItem
      data={value}
      onClick={onClick}
      onClose={onClose}
      dndRef={setNodeRef}
      style={style}
      dndAttributes={attributes}
      dndListeners={listeners}
      isSorting={isDragging}
    />
  );
}

SortableTabItem.propTypes = {
  value: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

function Tabs({ tabs, panels, userAuthorised, actions }) {
  const [isTabsListOverflown, setIsTabsListOverflown] = useState(false);
  const tabsListRef = useRef(null);
  const setTabsRef = useCallback((el) => {
    tabsListRef.current = el;
  }, []);

  // Same 10px activation distance react-sortable-hoc's `distance` prop
  // gave: a plain click on a tab shouldn't be mistaken for a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } })
  );

  const sortedTabs = R.sortBy(R.prop('index'))(R.values(tabs));

  const onCloseTab = useCallback(
    (tabId) => {
      // a little hack to correctly handle onBlur etc events, same as in onTabClick
      setTimeout(() => actions.closeTab(tabId), 0);
    },
    [actions]
  );

  const onTabClick = useCallback(
    (tabId, event) => {
      if (event.button === 1) {
        onCloseTab(tabId);
      } else {
        // a little hack to correctly handle onBlur etc events
        setTimeout(() => actions.switchTab(tabId), 0);
      }
    },
    [actions, onCloseTab]
  );

  const onDragEnd = useCallback(
    ({ active, over }) => {
      if (!over || active.id === over.id) return;

      const oldIndex = sortedTabs.findIndex((tab) => tab.id === active.id);
      const newIndex = sortedTabs.findIndex((tab) => tab.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      R.compose(
        actions.sortTabs,
        indexById,
        assocIndexes,
        R.insert(newIndex, sortedTabs[oldIndex]),
        R.remove(oldIndex, 1)
      )(sortedTabs);
    },
    [sortedTabs, actions]
  );

  const scrollTabsLeft = useCallback(() => {
    if (tabsListRef.current) tabsListRef.current.scrollLeft -= 100;
  }, []);

  const scrollTabsRight = useCallback(() => {
    if (tabsListRef.current) tabsListRef.current.scrollLeft += 100;
  }, []);

  return (
    <div className="Tabs">
      <SidebarSwitches
        id={SIDEBAR_IDS.LEFT}
        isMinimized
        panels={panels}
        onTogglePanel={actions.togglePanel}
        isLoggedIn={userAuthorised}
      />
      {isTabsListOverflown ? (
        <Icon
          Component="button"
          className="ScrollTabs"
          name="angle-left"
          onClickCapture={scrollTabsLeft}
        />
      ) : null}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToHorizontalAxis, restrictToParentElement]}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={sortedTabs.map((tab) => tab.id)}
          strategy={horizontalListSortingStrategy}
        >
          <TabsContainer
            forwardedRef={setTabsRef}
            onOverflowChange={setIsTabsListOverflown}
          >
            {sortedTabs.map((value) => (
              <SortableTabItem
                key={value.id}
                value={R.merge(value, { onClick: onTabClick, onClose: onCloseTab })}
                onClick={onTabClick}
                onClose={onCloseTab}
              />
            ))}
          </TabsContainer>
        </SortableContext>
      </DndContext>
      {isTabsListOverflown ? (
        <Icon
          Component="button"
          className="ScrollTabs"
          name="angle-right"
          onClickCapture={scrollTabsRight}
        />
      ) : null}
      <SidebarSwitches
        id={SIDEBAR_IDS.RIGHT}
        isMinimized
        panels={panels}
        onTogglePanel={actions.togglePanel}
        isLoggedIn={userAuthorised}
      />
    </div>
  );
}

Tabs.propTypes = {
  tabs: PropTypes.object,
  actions: PropTypes.objectOf(PropTypes.func),
  panels: PropTypes.objectOf(
    PropTypes.shape({
      /* eslint-disable react/no-unused-prop-types */
      maximized: PropTypes.bool.isRequired,
      sidebar: PropTypes.oneOf(R.values(SIDEBAR_IDS)).isRequired,
      autohide: PropTypes.bool.isRequired,
      /* eslint-enable react/no-unused-prop-types */
    })
  ),
  userAuthorised: PropTypes.bool.isRequired,
};

const MemoizedTabs = React.memo(Tabs, R.equals);

const mapStateToProps = R.applySpec({
  tabs: Selectors.getPreparedTabs,
  panels: Selectors.getAllPanelsSettings,
  userAuthorised: UserSelectors.isAuthorized,
});

const mapDispatchToprops = (dispatch) => ({
  actions: bindActionCreators(
    {
      switchTab: Actions.switchTab,
      closeTab: Actions.closeTab,
      sortTabs: Actions.sortTabs,
      togglePanel: Actions.togglePanel,
    },
    dispatch
  ),
});

export default connect(mapStateToProps, mapDispatchToprops)(MemoizedTabs);
