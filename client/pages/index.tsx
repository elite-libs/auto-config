import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Config Builder</title>
        <meta name="description" content="Visual Config Builder" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Build Unified XConfig</h1>

      </main>

      <footer className={styles.footer}>

      </footer>
    </div>
  )
}

export default Home
