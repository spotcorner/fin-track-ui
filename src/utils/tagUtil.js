export default {
    applyTags: (transaction, tags) => {
        const tagNames = [];
        tags.forEach(tag => {
            const { _id, keywords, name } = tag;
            transaction.appliedTags = transaction.appliedTags || {};
            if (transaction.appliedTags[_id] == 0) return;
            const description = transaction.description || "";
            const matched = _.some(keywords, (kw) => {
                if (kw.caseSensitive) return description.includes(kw.value);
                return _.toLower(description).includes(_.toLower(kw.value));
            });
            if (matched) {
                transaction.appliedTags[_id] = 1;
                tagNames.push(name);
            }
        });
        transaction.tagNames = tagNames;
    },
}
