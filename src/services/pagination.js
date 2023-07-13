

export const paginate = (page = 1, size = 5) => {
    if (page < 1) {
        page = 1;
    }
    if (size < 1) {
        size = 1;
    }
    const skip = (page - 1) * size
    return { skip: parseInt(skip), limit: parseInt(size) }
}