import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, adminProcedure } from '../trpc';
import { flaskGateway } from '../lib/flask-gateway';
import { openrouter } from '../lib/openrouter';
import { composio } from '../lib/composio';

const ListingFilterSchema = z.object({
  status: z.enum(['active', 'pending', 'sold', 'rented', 'withdrawn', 'expired', 'draft']).optional(),
  propertyType: z.enum(['house', 'apartment', 'condo', 'land', 'commercial', 'villa', 'farm']).optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  minBedrooms: z.number().optional(),
  minBathrooms: z.number().optional(),
  location: z.string().optional(),
  limit: z.number().default(20),
  offset: z.number().default(0),
});

const ListingCreateSchema = z.object({
  title: z.string().min(5),
  description: z.string().optional(),
  propertyType: z.enum(['house', 'apartment', 'condo', 'land', 'commercial', 'villa', 'farm']),
  price: z.number().positive(),
  bedrooms: z.number().nonnegative(),
  bathrooms: z.number().nonnegative(),
  squareMeters: z.number().positive(),
  location: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  amenities: z.array(z.string()).optional(),
  imageUrls: z.array(z.string()).optional(),
});

export const listingsRouter = router({
  /**
   * Get all listings with filters
   */
  list: publicProcedure.input(ListingFilterSchema).query(async ({ input }) => {
    try {
      const listings = await flaskGateway.getListings({
        status: input.status,
        property_type: input.propertyType,
        min_price: input.minPrice,
        max_price: input.maxPrice,
        limit: input.limit,
        offset: input.offset,
      });
      return listings;
    } catch (error) {
      throw new Error(`Failed to fetch listings: ${error}`);
    }
  }),

  /**
   * Get single listing with stats
   */
  byId: publicProcedure.input(z.string()).query(async ({ input: id }) => {
    try {
      const [listing, stats] = await Promise.all([
        flaskGateway.getListingById(id),
        flaskGateway.getListingStats(id),
      ]);

      return {
        ...listing,
        stats: stats,
      };
    } catch (error) {
      throw new Error(`Failed to fetch listing: ${error}`);
    }
  }),

  /**
   * Search listings with AI-powered relevance
   */
  search: publicProcedure
    .input(
      z.object({
        query: z.string(),
        filters: ListingFilterSchema.optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        return await flaskGateway.searchListings(input.query, input.filters);
      } catch (error) {
        throw new Error(`Search failed: ${error}`);
      }
    }),

  /**
   * Create listing (agent/seller only)
   */
  create: protectedProcedure
    .input(ListingCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      try {
        const listing = await flaskGateway.createListing(
          {
            ...input,
            agent_id: ctx.userId,
            status: 'draft',
          },
          ctx.req.headers.authorization?.replace('Bearer ', '') || ''
        );

        return listing;
      } catch (error) {
        throw new Error(`Failed to create listing: ${error}`);
      }
    }),

  /**
   * Update listing
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: ListingCreateSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new Error('Not authenticated');

      try {
        const updated = await flaskGateway.updateListing(
          input.id,
          input.data,
          ctx.req.headers.authorization?.replace('Bearer ', '') || ''
        );

        return updated;
      } catch (error) {
        throw new Error(`Failed to update listing: ${error}`);
      }
    }),

  /**
   * Delete listing (admin/owner only)
   */
  delete: protectedProcedure.input(z.string()).mutation(async ({ ctx, input: id }) => {
    if (!ctx.userId) throw new Error('Not authenticated');

    try {
      await flaskGateway.deleteListing(id, ctx.req.headers.authorization?.replace('Bearer ', '') || '');
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete listing: ${error}`);
    }
  }),

  /**
   * Auto-generate description with AI
   */
  generateDescription: protectedProcedure
    .input(
      z.object({
        propertyData: z.object({
          title: z.string(),
          bedrooms: z.number(),
          bathrooms: z.number(),
          squareMeters: z.number(),
          amenities: z.array(z.string()).optional().default([]),
          location: z.string(),
          highlights: z.array(z.string()).optional().default([]),
        }),
        style: z.enum(['professional', 'casual', 'poetic']).default('professional'),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await openrouter.generateDescription(input.propertyData, input.style);
        return result;
      } catch (error) {
        throw new Error(`Failed to generate description: ${error}`);
      }
    }),

  /**
   * Get price suggestions
   */
  suggestPrice: publicProcedure
    .input(
      z.object({
        location: z.string(),
        propertyType: z.string(),
        bedrooms: z.number(),
        bathrooms: z.number(),
        squareMeters: z.number(),
        condition: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const result = await openrouter.suggestPrice({
          ...input,
          recentSales: [], // Would be populated from Flask backend
        });
        return result;
      } catch (error) {
        throw new Error(`Failed to suggest price: ${error}`);
      }
    }),

  /**
   * Generate SEO keywords
   */
  generateKeywords: publicProcedure
    .input(
      z.object({
        description: z.string(),
        location: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const result = await openrouter.generateKeywords(input.description, input.location);
        return result;
      } catch (error) {
        throw new Error(`Failed to generate keywords: ${error}`);
      }
    }),

  /**
   * Publish listing (sends notifications)
   */
  publish: protectedProcedure.input(z.string()).mutation(async ({ ctx, input: id }) => {
    if (!ctx.userId) throw new Error('Not authenticated');

    try {
      const token = ctx.req.headers.authorization?.replace('Bearer ', '') || '';
      const listing = await flaskGateway.updateListing(
        id,
        { status: 'active' },
        token
      );

      // Optional: Send notification
      console.log(`[Listings] Published listing ${id}`);

      return listing;
    } catch (error) {
      throw new Error(`Failed to publish listing: ${error}`);
    }
  }),
});
