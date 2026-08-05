import { For } from "solid-js";
import type {
  ValidationAssertionDetail,
  ValidationAssertionGroup,
  ValidationAssertionLeaf,
  ValidationAssertionTreeNode,
} from "../validation/reports";

type ValidationAssertionTreeProps = Readonly<{
  tree: ValidationAssertionGroup;
}>;

const statusLabel = (status: ValidationAssertionLeaf["assertion"]["status"]) =>
  status === "passed" ? "Passed" : "Failed";

const Detail = (props: Readonly<{ detail: ValidationAssertionDetail }>) => (
  <div class="validation-assertion-detail">
    <dt>{props.detail.label}</dt>
    <dd>{props.detail.value}</dd>
  </div>
);

const Assertion = (props: Readonly<{ assertion: ValidationAssertionLeaf }>) => (
  <li class="validation-assertion-node">
    <details open={props.assertion.expandedByDefault}>
      <summary>
        <span>{props.assertion.label}</span>
        <span class="validation-assertion-status" data-status={props.assertion.assertion.status}>
          {statusLabel(props.assertion.assertion.status)}
        </span>
      </summary>
      <dl>
        <For each={props.assertion.children}>{(detail) => <Detail detail={detail} />}</For>
      </dl>
    </details>
  </li>
);

const TreeNodes = (props: Readonly<{ nodes: readonly ValidationAssertionTreeNode[] }>) => (
  <ul>
    <For each={props.nodes}>
      {(node) => {
        switch (node.kind) {
          case "group":
            return <Group group={node} />;
          case "assertion":
            return <Assertion assertion={node} />;
          case "detail":
            return (
              <li class="validation-assertion-orphan-detail">
                <span>{node.label}</span>: {node.value}
              </li>
            );
        }
      }}
    </For>
  </ul>
);

const Group = (props: Readonly<{ group: ValidationAssertionGroup }>) => (
  <li class="validation-assertion-group">
    <details open={props.group.expandedByDefault}>
      <summary>{props.group.label}</summary>
      <TreeNodes nodes={props.group.children} />
    </details>
  </li>
);

/**
 * Presents the evaluated constraint hierarchy as nested disclosure controls.
 * The report owns the grouping and default expansion state; this component is
 * intentionally only a rendering adapter.
 */
export const ValidationAssertionTree = (props: ValidationAssertionTreeProps) => (
  <div class="validation-assertion-tree" aria-label="Constraint assertions">
    <TreeNodes nodes={[props.tree]} />
  </div>
);
