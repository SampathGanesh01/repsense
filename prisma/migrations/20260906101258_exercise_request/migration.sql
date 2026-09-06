-- CreateTable
CREATE TABLE "ExerciseRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseName" TEXT NOT NULL,
    "videoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExerciseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExerciseRequest_userId_idx" ON "ExerciseRequest"("userId");

-- AddForeignKey
ALTER TABLE "ExerciseRequest" ADD CONSTRAINT "ExerciseRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
