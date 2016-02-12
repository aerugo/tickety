/*
Creates or updates the CallBack object.
*/

IF @callBackId IS NULL
BEGIN
  
  INSERT INTO [dbo].[CallBack] (
      [ticketId]
    , [userId]
    , [callBackDate]
    , [callBackStatus]
    , [reasonToPromote1]
    , [reasonToPromote2]
    , [reasonToDetract1]
    , [reasonToDetract2]
    , [callBackFollowUpAction]
    , [callBackComment]
  )
  VALUES (
      @ticketId
    , @userId
    , @callBackDate
    , @callBackStatus
    , @reasonToPromote1
    , @reasonToPromote2
    , @reasonToDetract1
    , @reasonToDetract2
    , @callBackFollowUpAction
    , @callBackComment
  )
  
  SELECT @callBackId = MAX(callBackId) FROM [dbo].[CallBack]

END
ELSE
  UPDATE [dbo].[CallBack]
  SET   [ticketId] = @ticketId
      , [userId] = @userId
      , [callBackDate] = @callBackDate
      , [callBackStatus] = @callBackStatus
      , [reasonToPromote1] = @reasonToPromote1
      , [reasonToPromote2] = @reasonToPromote2
      , [reasonToDetract1] = @reasonToDetract1
      , [reasonToDetract2] = @reasonToDetract2
      , [callBackFollowUpAction] = @callBackFollowUpAction
      , [callBackComment] = @callBackComment
      , [dateUpdated] = GETUTCDATE()
  WHERE [callBackId] = @callBackId
