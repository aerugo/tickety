/*
Inserts a new ticket and a categoryBlob
*/

SET XACT_ABORT ON

BEGIN TRAN

-- Set person in other file
-- { person }


-- Ticket
INSERT INTO [dbo].[Ticket] (
  [name],
  [email],
  [tel],
  [altTel],
  [isReseller],
  -- [personId],
  [summary],
  [transferred],
  [status],
  [country],
  [customerId],
  [userId],
  [departmentId],
  [transferredDepartmentId],
  [productId],
  [ticketDate],
  [ticketDateClosed]
)
VALUES (
  @name,
  @email,
  @tel,
  @altTel,
  @isReseller,
  -- @personId
  @summary,
  @transferred,
  @status,
  @country,
  @customerId,
  @userId,
  @departmentId,
  @transferredDepartmentId,
  @productId,
  @ticketDate,
  @ticketDateClosed
)

-- Categort blob
INSERT INTO [dbo].[CategoryBlob] (
  [ticketId],
  [categoryId],
  [subcategoryId],
  [descriptorId]
)
SELECT MAX([dbo].[Ticket].[ticketId]) AS [ticketId],
  @categoryId AS [categoryId],
  @subcategoryId AS [subcategoryId],
  @descriptorId AS [descriptorId]
FROM [dbo].[Ticket]

COMMIT TRAN

-- Select the newly created ticket done in other file.
-- The files are combined using javascript
DECLARE @ticketId BIGINT

SET @ticketId = (
  SELECT MAX([ticketId])
  FROM [dbo].[Ticket]
)
