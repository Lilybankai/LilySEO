// Stub file for @tanstack/react-query
export const useQuery = () => ({
  data: null,
  isLoading: false,
  error: null,
  refetch: () => Promise.resolve({}),
});

export const useMutation = () => ({
  mutate: () => {},
  isLoading: false,
  error: null,
});

export const useQueryClient = () => ({
  invalidateQueries: () => Promise.resolve(),
  setQueryData: () => {},
});

export const QueryClient = class {
  constructor() {}
  invalidateQueries() {}
  setQueryData() {}
};

export const QueryClientProvider = ({ children }) => children; 