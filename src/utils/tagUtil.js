const resolveLinkedTags = (matchedIds, tags, ruleResult) => {
    const visited = new Set(matchedIds);
    const queue = [...matchedIds];
    while (queue.length > 0) {
        const id = queue.shift();
        tags.forEach(tag => {
            if (!visited.has(tag._id) && tag.linkedTags?.includes(id)) {
                visited.add(tag._id);
                ruleResult[tag._id] = 3;
                queue.push(tag._id);
            }
        });
    }
};

export default {
    applyTags: (transaction, tags) => {
        if (!transaction._appliedTags) {
            transaction._appliedTags = { ...transaction.appliedTags };
        }
        const ruleResult = {};
        const matches = [];
        tags.forEach(tag => {
            const { _id, rules, priority = 0 } = tag;
            if (transaction._appliedTags[_id] == 1) { matches.push({ _id, priority }); return; }
            const matched = _.some(rules, (rule) => {
                const description = transaction.description || "";
                if (rule.type === "keyword") {
                    if (rule.caseSensitive) return description.includes(rule.value);
                    return _.toLower(description).includes(_.toLower(rule.value));
                }
                if (rule.type === "pattern") {
                    try {
                        const flags = rule.caseSensitive ? "" : "i";
                        return new RegExp(rule.value, flags).test(description);
                    } catch (e) { return false; }
                }
                return false;
            });
            if (matched) matches.push({ _id, priority });
        });

        // Keep only highest priority matches
        const maxPriority = matches.length > 0 ? Math.max(...matches.map(m => m.priority)) : 0;
        const matchedIds = [];
        matches.forEach(m => {
            if (m.priority === maxPriority) {
                if (transaction._appliedTags[m._id] != 1) ruleResult[m._id] = 2;
                matchedIds.push(m._id);
            }
        });

        resolveLinkedTags(matchedIds, tags, ruleResult);
        transaction.ruleResult = ruleResult;
        transaction.appliedTags = { ...ruleResult, ...transaction._appliedTags };
    },
}
