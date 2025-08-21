import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getListings, createListing, deleteListing, Listing } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

export const useListings = (userId: string) => {
  return useQuery({
    queryKey: ['listings', userId],
    queryFn: () => getListings(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCreateListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createListing,
    onSuccess: (newListing) => {
      // Optimistically update the cache
      queryClient.setQueryData(
        ['listings', newListing.user_id],
        (old: Listing[] | undefined) => {
          if (!old) return [newListing];
          return [newListing, ...old];
        }
      );
      
      toast.success('Listing created successfully!');
    },
    onError: (error) => {
      console.error('Failed to create listing:', error);
      toast.error('Failed to create listing. Please try again.');
    },
  });
};

export const useDeleteListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteListing,
    onSuccess: (_, listingId) => {
      // Optimistically remove from cache
      queryClient.setQueryData(
        ['listings'],
        (old: Listing[] | undefined) => {
          if (!old) return [];
          return old.filter(listing => listing.id !== listingId);
        }
      );
      
      toast.success('Listing deleted successfully!');
    },
    onError: (error) => {
      console.error('Failed to delete listing:', error);
      toast.error('Failed to delete listing. Please try again.');
    },
  });
};

export const useListing = (listingId: string, userId: string) => {
  return useQuery({
    queryKey: ['listing', listingId],
    queryFn: async () => {
      const listings = await getListings(userId);
      return listings.find(listing => listing.id === listingId);
    },
    enabled: !!listingId && !!userId,
    staleTime: 5 * 60 * 1000,
  });
};
