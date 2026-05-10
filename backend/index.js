const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.post('/bfhl', (req, res) => {
    try {
        const { data } = req.body;

        if (!data || !Array.isArray(data)) {
            return res.status(400).json({ error: "Invalid request, 'data' must be an array." });
        }

        const invalid_entries = [];
        const duplicate_edges = [];
        const valid_edges = [];
        const seen_edges = new Set();
        const child_to_parent = new Map();
        const parent_to_children = new Map();
        const all_nodes = new Set();

        // 1. Process Edges
        for (const entry of data) {
            if (typeof entry !== 'string') {
                invalid_entries.push(String(entry));
                continue;
            }

            const trimmed = entry.trim();
            if (!/^[A-Z]->[A-Z]$/.test(trimmed)) {
                invalid_entries.push(entry);
            } else {
                const [u, v] = trimmed.split('->');
                if (u === v) {
                    invalid_entries.push(entry); // Self-loop - treated as invalid
                    continue;
                }

                if (seen_edges.has(trimmed)) {
                    duplicate_edges.push(trimmed);
                } else {
                    seen_edges.add(trimmed);

                    // Diamond / multi-parent case
                    if (!child_to_parent.has(v)) {
                        child_to_parent.set(v, u);
                        if (!parent_to_children.has(u)) {
                            parent_to_children.set(u, []);
                        }
                        parent_to_children.get(u).push(v);
                        valid_edges.push(trimmed);
                        all_nodes.add(u);
                        all_nodes.add(v);
                    } else {
                        // Silently discard subsequent parent edges for that child
                        all_nodes.add(u);
                        all_nodes.add(v);
                    }
                }
            }
        }

        // 2. Identify Roots
        let roots = [];
        for (const node of all_nodes) {
            if (!child_to_parent.has(node)) {
                roots.push(node);
            }
        }
        roots.sort();

        const visited = new Set();
        const hierarchies = [];
        let total_trees = 0;
        let total_cycles = 0;
        let max_depth = 0;
        let largest_tree_root = null;

        // Helper to build tree recursively
        function buildTree(node) {
            visited.add(node);
            let tree = {};
            let childMaxDepth = 0;

            const children = parent_to_children.get(node) || [];
            children.sort(); // Sort children alphabetically for consistent output
            for (const child of children) {
                const childRes = buildTree(child);
                tree[child] = childRes.tree;
                childMaxDepth = Math.max(childMaxDepth, childRes.depth);
            }

            return { tree, depth: 1 + childMaxDepth };
        }

        // 3. Build Trees from Roots
        for (const root of roots) {
            const res = buildTree(root);
            hierarchies.push({
                root: root,
                tree: { [root]: res.tree },
                depth: res.depth
            });
            total_trees++;

            if (res.depth > max_depth) {
                max_depth = res.depth;
                largest_tree_root = root;
            } else if (res.depth === max_depth) {
                if (!largest_tree_root || root < largest_tree_root) {
                    largest_tree_root = root;
                }
            }
        }

        // 4. Detect Pure Cycles
        let unvisited = Array.from(all_nodes).filter(n => !visited.has(n));
        while (unvisited.length > 0) {
            const start = unvisited[0];
            const cycle_nodes = [];
            let curr = start;

            while (!visited.has(curr)) {
                visited.add(curr);
                cycle_nodes.push(curr);
                const children = parent_to_children.get(curr) || [];
                if (children.length > 0) {
                    curr = children[0];
                } else {
                    break;
                }
            }

            cycle_nodes.sort();
            if (cycle_nodes.length > 0) {
                const cycle_root = cycle_nodes[0];
                hierarchies.push({
                    root: cycle_root,
                    tree: {},
                    has_cycle: true
                });
                total_cycles++;
            }

            unvisited = Array.from(all_nodes).filter(n => !visited.has(n));
        }

        const response = {
            user_id: "vijayreddy_2006", // To be updated
            email_id: "sb3761@srmist.edu.in", // To be updated
            college_roll_number: "RA2311003020666", // To be updated
            hierarchies,
            invalid_entries,
            duplicate_edges,
            summary: {
                total_trees,
                total_cycles,
                largest_tree_root: largest_tree_root || "" // Use empty string if no valid trees
            }
        };

        res.json(response);

    } catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
