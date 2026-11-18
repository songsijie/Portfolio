import React from "react";
import {
  COLORS,
  LOGO_PATHS,
  NAV_HEIGHT,
  NAV_TOP,
  PAGE_WIDTH,
  RULER_SIZE,
} from "../scene/theme.js";
import { SceneElements } from "./SceneElements.jsx";
import { SceneInteractions } from "./SceneInteractions.jsx";
import { START_ACTION } from "../interactions/actions.js";

/**
 * 展示普通页面内容，视口不足1280像素时按原站规则整体等比缩放。
 * @param {{engine:object,interactions:object[],onAction:Function}} props 动画引擎、点击区域配置与动作处理器。
 * @returns {React.ReactElement} 正文画布。
 */
export function ContentCanvas({ engine, interactions, onAction }) {
  // 坐标全部由场景数据管理，React层只进行一次统一缩放。
  const { s: scale, left } = engine.vp;
  return (
    <div
      className="canvas"
      style={{
        width: engine.width,
        height: engine.height,
        transform: `translateX(${left}px) scale(${scale})`,
      }}
    >
      <SceneElements
        elements={engine.list.filter((element) => !element.sticky)}
        height={engine.height}
      />
      <SceneInteractions
        engine={engine}
        interactions={interactions}
        onAction={onAction}
      />
    </div>
  );
}

/**
 * 将导航实体放到吸顶容器中，并为展开的标尺留出相同偏移。
 * @param {{engine:object,interactions:object[],onAction:Function}} props 动画引擎、点击区域配置与动作处理器。
 * @returns {React.ReactElement} 吸顶导航画布。
 */
export function StickyNavigation({ engine, interactions, onAction }) {
  // 背景在导航开始施工后才出现，避免初始白纸状态多出遮挡层。
  const { s: scale, left } = engine.vp;
  const elements = engine.list.filter((element) => element.sticky);
  return (
    <div
      className="nav-sticky"
      style={{
        marginTop: NAV_TOP * scale,
        height: NAV_HEIGHT * scale,
        top: RULER_SIZE * engine.rulers.t,
      }}
    >
      {elements.some((element) => element.vis) && <div className="nav-backdrop" />}
      <div
        className="nav-canvas"
        style={{
          width: engine.width,
          transform: `translateX(${left}px) scale(${scale}) translateY(${-NAV_TOP}px)`,
        }}
      >
        <SceneElements elements={elements} height={NAV_TOP + NAV_HEIGHT + 30} />
        <SceneInteractions
          engine={engine}
          sticky
          interactions={interactions}
          onAction={onAction}
        />
      </div>
    </div>
  );
}

/**
 * 显示进入页面时的中心标志，开始滚动施工后按原站节奏淡出。
 * @param {{started:boolean,onAction:Function}} props 是否已开始施工及点击动作处理器。
 * @returns {React.ReactElement} 首屏标志。
 */
export function IntroLogo({ started, onAction }) {
  // 标志形状直接来自集中管理的SVG数据，导航和页脚也使用同一轮廓。
  return (
    <div className={`intro-logo${started ? " gone" : ""}`} aria-hidden={started}>
      <button
        className="intro-trigger"
        type="button"
        aria-label="Start building the page"
        title="Click to start building"
        disabled={started}
        onClick={() => onAction(START_ACTION)}
      >
        <svg viewBox="0 0 120 140" width={60} height={70} aria-hidden="true">
          {LOGO_PATHS.map((path, index) => (
            <path key={index} d={path.d} fill={COLORS.line} />
          ))}
        </svg>
      </button>
    </div>
  );
}
