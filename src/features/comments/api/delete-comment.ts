import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { useNotificationStore } from '@/stores/notifications';

import { Comment } from '../types';

export const deleteComment = ({ commentId }: { commentId: string }) => {
  return api.delete(`/comments/${commentId}`);
};

type UseDeleteCommentOptions = {
  discussionId: string;
  config?: MutationConfig<typeof deleteComment>;
};

export const useDeleteComment = ({
  config,
  discussionId,
}: UseDeleteCommentOptions) => {
  const { addNotification } = useNotificationStore();
  const queryClient = useQueryClient();

  return useMutation({
    onMutate: async (deletedComment) => {
      await queryClient.cancelQueries({
        queryKey: ['comments', discussionId],
      });

      const previousComments = queryClient.getQueryData<Comment[]>([
        'comments',
        discussionId,
      ]);

      queryClient.setQueryData(
        ['comments', discussionId],
        previousComments?.filter(
          (comment) => comment.id !== deletedComment.commentId,
        ),
      );

      return { previousComments };
    },
    onError: (_, __, context: any) => {
      if (context?.previousComments) {
        queryClient.setQueryData(
          ['comments', discussionId],
          context.previousComments,
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['comments', discussionId],
      });
      addNotification({
        type: 'success',
        title: 'Comment Deleted',
      });
    },
    ...config,
    mutationFn: deleteComment,
  });
};
